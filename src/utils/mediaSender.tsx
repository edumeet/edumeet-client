import EventEmitter from 'events';
import { Logger } from 'edumeet-common';
import { MediaService, ProducerCodec } from '../services/mediaService';
import { ProducerSource } from './types';
import { Producer, ProducerOptions } from 'mediasoup-client/lib/types';
import type { Producer as PeerProducer } from 'ortc-p2p/src/Producer';
import { SignalingService } from '../services/signalingService';
import { VolumeWatcher } from './volumeWatcher';
import hark from 'hark';

const logger = new Logger('MediaSender');

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface MediaSender {
	// eslint-disable-next-line no-unused-vars
	on(event: 'closed', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'started', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'stopped', listener: () => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MediaSender extends EventEmitter {
	private mediaService: MediaService;
	private signalingService: SignalingService;
	public source: ProducerSource;
	public volumeWatcher?: VolumeWatcher;

	public running = false;
	public paused = false;

	private producerOptions: ProducerOptions = {};
	private codec?: ProducerCodec;
	public producer?: Producer;
	public peerProducers: Map<string, PeerProducer> = new Map();
	private peerProducingPromises: Map<string, Promise<PeerProducer>> = new Map();

	public peerIds: string[] = [];
	public p2pProduce = false;

	constructor(
		mediaService: MediaService,
		signalingService: SignalingService,
		source: ProducerSource,
	) {
		super();
	
		logger.debug('constructor()');

		this.mediaService = mediaService;
		this.signalingService = signalingService;
		this.source = source;

		this.handleSignaling();
	}

	get track(): MediaStreamTrack | null {
		return this.producerOptions.track ?? null;
	}

	private handleSignaling(): void {
		this.signalingService.on('notification', (notification) => {
			switch (notification.method) {
				case 'producerClosed': {
					const { producerId } = notification.data;

					// If the server closes our producer, we stop all producing
					if (this.producer?.id === producerId)
						this.stop(false);

					break;
				}

				case 'newProducerLayer': {
					const { producerId, spatialLayer } = notification.data;

					if (this.producer?.id === producerId)
						this.producer?.setMaxSpatialLayer(spatialLayer);

					break;
				}
			}
		});
	}

	public async start(producerOptions: ProducerOptions, codec?: ProducerCodec): Promise<void> {
		logger.debug('produce() [options:%o]', producerOptions);

		if (this.running) throw new Error('Already producing');

		this.running = true;
		this.producerOptions = producerOptions;
		this.codec = codec;
		this.handleTrack();

		const promises: Promise<Producer | PeerProducer>[] = [ this.sfuProduce() ];

		if (this.p2pProduce) {
			promises.push(...this.peerIds.map((peerId) => this.peerProduce(peerId)));
		}

		const [ sfuResult ] = await Promise.allSettled(promises);

		if (sfuResult.status === 'rejected') {
			this.stop();
			
			throw sfuResult.reason;
		} else if (this.p2pProduce) {
			sfuResult.value.pause();
		}

		this.emit('started');
		this.maybeAddHark();
	}

	public stop(local = true, notifyServer = false): void {
		logger.debug('stop() [local:%s, source:%s]', local, this.source);

		if (!this.running) return;

		this.running = false;

		if (this.producer) {
			this.producer.appData.remoteClosed = !local && !notifyServer;
			this.producer.close();
		}

		for (const producer of this.peerProducers.values()) {
			producer.appData.remoteClosed = !local && !notifyServer;
			producer.close();
		}

		for (const [ peerId, producerPromise ] of this.peerProducingPromises.entries()) {
			this.peerProducingPromises.delete(peerId);

			producerPromise.then((producer) => {
				producer.appData.remoteClosed = !local;
				producer.close();
			});
		}

		this.track?.stop();
		this.producerOptions = {};
		this.codec = undefined;

		if (!local) this.emit('closed');
		this.emit('stopped');

		this.paused = false;
	}

	public addPeerId(peerId: string): void {
		logger.debug('addPeerId() [peerId:%s]', peerId);

		this.peerIds.push(peerId);

		if (this.running && this.p2pProduce && !this.peerProducers.has(peerId)) {
			this.peerProduce(peerId);
		}
	}

	public removePeerId(peerId: string): void {
		logger.debug('removePeerId() [peerId:%s]', peerId);

		this.peerIds = this.peerIds.filter((id) => id !== peerId);

		const producer = this.peerProducers.get(peerId);

		producer?.close();
	}

	public startP2P(): void {
		logger.debug('startP2P()');

		this.p2pProduce = true;

		if (!this.running) return;

		for (const peerId of this.peerIds) {
			this.peerProduce(peerId).then((producer) => {
				if (this.paused) producer.pause();
			});
		}

		// Always pause the SFU producer when starting P2P
		this.producer?.pause();
	}

	public stopP2P(): void {
		logger.debug('stopP2P()');

		this.p2pProduce = false;

		if (!this.running) return;

		for (const producer of this.peerProducers.values()) {
			producer.close();
		}

		for (const [ peerId, producerPromise ] of this.peerProducingPromises.entries()) {
			this.peerProducingPromises.delete(peerId);

			producerPromise.then((producer) => producer.close());
		}

		// Maybe resume the SFU producer when stopping P2P
		if (!this.paused) this.producer?.resume();
	}

	public pause(): void {
		logger.debug('pause()');

		this.paused = true;

		this.producer?.pause();

		for (const producer of this.peerProducers.values()) {
			producer.pause();
		}

		for (const producerPromise of this.peerProducingPromises.values()) {
			producerPromise.then((producer) => {
				if (producer.closed || !this.p2pProduce) return;

				if (this.paused) producer.pause();
				else producer.resume();
			});
		}
	}

	public resume(): void {
		logger.debug('resume()');

		this.paused = false;

		if (!this.p2pProduce) this.producer?.resume();

		for (const producer of this.peerProducers.values()) {
			producer.resume();
		}

		for (const producerPromise of this.peerProducingPromises.values()) {
			producerPromise.then((producer) => {
				if (producer.closed || !this.p2pProduce) return;

				if (this.paused) producer.pause();
				else producer.resume();
			});
		}
	}

	private maybeAddHark(): void {
		this.volumeWatcher?.hark.stop();

		if (this.track?.kind === 'audio') {
			const harkStream = new MediaStream();

			harkStream.addTrack(this.track.clone());

			const producerHark = hark(harkStream, {
				play: false,
				interval: 100,
				threshold: -60,
				history: 100
			});

			this.volumeWatcher = new VolumeWatcher({ hark: producerHark });
		}
	}

	public async replaceTrack(track: MediaStreamTrack): Promise<void> {
		logger.debug('replaceTrack() [track:%o]', track);

		if (!this.running) throw new Error('Not producing');

		const oldTrack = this.track;

		this.producerOptions.track = track;
		this.handleTrack();
		this.maybeAddHark();
		
		await this.producer?.replaceTrack({ track: this.track?.clone() ?? null });

		for (const producer of this.peerProducers.values()) {
			await producer.replaceTrack({ track: this.track?.clone() ?? null });
		}

		for (const producerPromise of this.peerProducingPromises.values()) {
			await producerPromise.then((producer) => producer.replaceTrack({ track: this.track?.clone() ?? null }));
		}

		oldTrack?.stop();
	}

	private async sfuProduce(): Promise<Producer> {
		logger.debug('sfuProducer() [options:%o]', this.producerOptions);

		await this.mediaService.transportsReady;

		if (!this.mediaService.sendTransport) throw new Error('Send transport not ready');

		const producerOptions = {
			...this.producerOptions,
			track: this.track?.clone()
		};

		const producer = await this.mediaService.sendTransport.produce({
			...producerOptions,
			codec: this.mediaService.mediasoup?.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === this.codec)
		});

		const pauseListener = () => this.signalingService.notify('pauseProducer', { producerId: producer.id });
		const resumeListener = () => this.signalingService.notify('resumeProducer', { producerId: producer.id });

		producer.observer.once('close', () => {
			producer.observer.off('pause', pauseListener);
			producer.observer.off('resume', resumeListener);

			if (!producer.appData.remoteClosed)
				this.signalingService.notify('closeProducer', { producerId: producer.id });
		});

		if (!this.running) {
			producer.close();

			throw new Error('Producer not needed');
		}

		this.producer = producer;

		producer.observer.on('pause', pauseListener);
		producer.observer.on('resume', resumeListener);

		return producer;
	}

	private async peerProduce(peerId: string): Promise<PeerProducer> {
		logger.debug('peerProduce() [peerId:%s, options:%o]', peerId, this.producerOptions);

		let peerProducingPromise = this.peerProducingPromises.get(peerId);

		if (!peerProducingPromise) {
			peerProducingPromise = (async () => {
				const peerDevice = this.mediaService.getPeerDevice(peerId);
				const transport = await this.mediaService.getPeerTransport(peerId, 'send');

				const producerOptions = {
					...this.producerOptions,
					track: this.track?.clone()
				};
		
				const producer = await transport.produce({
					...producerOptions,
					codec: peerDevice.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === this.codec)
				});

				const pauseListener = () => this.signalingService.notify('peerPauseProducer', { producerId: producer.id, peerId });
				const resumeListener = () => this.signalingService.notify('peerResumeProducer', { producerId: producer.id, peerId });

				producer.observer.once('close', () => {
					producer.observer.off('pause', pauseListener);
					producer.observer.off('resume', resumeListener);

					if (!producer.appData.remoteClosed)
						this.signalingService.notify('peerCloseProducer', { producerId: producer.id, peerId });

					this.peerProducers.delete(peerId);
				});

				if (!this.p2pProduce || !this.peerIds.find((id) => id === peerId) || !this.running) {
					this.peerProducingPromises.delete(peerId);

					producer.close();

					throw new Error('Producer not needed');
				}

				producer.appData.peerProducer = true;
				producer.appData.peerId = peerId;

				this.peerProducers.set(peerId, producer);
		
				producer.observer.on('pause', pauseListener);
				producer.observer.on('resume', resumeListener);

				if (this.paused) producer.pause();

				this.peerProducingPromises.delete(peerId);

				return producer;
			})();

			this.peerProducingPromises.set(peerId, peerProducingPromise);
		}

		return peerProducingPromise;
	}

	private handleTrack(): void {
		this.track?.addEventListener('ended', () => {
			this.stop(false, true);
		}, { once: true });
	}
}
