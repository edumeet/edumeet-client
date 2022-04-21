import EventEmitter from 'events';
import { Device } from 'mediasoup-client';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer, ProducerOptions } from 'mediasoup-client/lib/Producer';
import { Transport } from 'mediasoup-client/lib/Transport';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { Logger } from '../utils/logger';
import { SignalingService } from './signalingService';

const logger = new Logger('MediaService');

export type MediaChange = 'pause' | 'resume' | 'close';

interface MediaCapabilities {
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
}

const changeEvent = {
	pause: 'Paused',
	resume: 'Resumed',
	close: 'Closed',
	consumerPaused: 'pause',
	consumerResumed: 'resume',
	consumerClosed: 'close',
	producerPaused: 'pause',
	producerResumed: 'resume',
	producerClosed: 'close',
};

export declare interface MediaService {
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerCreated', listener: (consumer: Consumer, producerPaused: boolean) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerClosed', listener: (consumer: Consumer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerPaused', listener: (consumer: Consumer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerResumed', listener: (consumer: Consumer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerClosed', listener: (producer: Producer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerPaused', listener: (producer: Producer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerResumed', listener: (producer: Producer) => void): this;
}

export class MediaService extends EventEmitter {
	private signalingService: SignalingService;

	private mediasoup: Device = new Device();
	private sendTransport: Transport | undefined;
	private recvTransport: Transport | undefined;
	private producers: Map<string, Producer> = new Map();
	private consumers: Map<string, Consumer> = new Map();
	private tracks: Map<string, MediaStreamTrack> = new Map();

	constructor({ signalingService }: { signalingService: SignalingService }) {
		super();

		this.signalingService = signalingService;

		this.handleSignaling();
	}

	public getConsumer(consumerId: string): Consumer | undefined {
		return this.consumers.get(consumerId);
	}

	public getProducer(producerId: string): Producer | undefined {
		return this.producers.get(producerId);
	}

	public getProducers(): Producer[] {
		return [ ...this.producers.values() ];
	}

	public getTrack(trackId: string): MediaStreamTrack | undefined {
		return this.tracks.get(trackId);
	}

	public addTrack(track: MediaStreamTrack): void {
		logger.debug('addTrack() [trackId:%s]', track.id);

		this.tracks.set(track.id, track);

		track.addEventListener('ended', () => {
			logger.debug('addTrack() | track "ended" [trackId:%s]', track.id);

			this.tracks.delete(track.id);
		});
	}

	public removeTrack(trackId: string | undefined): void {
		logger.debug('removeTrack() [trackId:%s]', trackId);

		trackId && this.tracks.delete(trackId);
	}

	private handleSignaling(): void {
		this.signalingService.on('notification', async (notification) => {
			logger.debug(
				'signalingService "notification" event [method:%s, data:%o]',
				notification.method, notification.data);

			try {
				switch (notification.method) {
					case 'newConsumer': {
						const {
							peerId,
							producerId,
							id,
							kind,
							rtpParameters,
							// type,
							appData,
							producerPaused,
						} = notification.data;

						if (!this.recvTransport) {
							throw new Error('Consumer can not be created without recvTransport');
						}
	
						const consumer = await this.recvTransport.consume({
							id,
							producerId,
							kind,
							rtpParameters,
							appData: {
								...appData,
								peerId,
							},
						});

						await this.signalingService.sendRequest('resumeConsumer', { consumerId: consumer.id })
							.catch((error) => logger.warn('resumeConsumer, unable to resume server-side [consumerId:%s, error:%o]', consumer.id, error));
	
						this.consumers.set(consumer.id, consumer);

						consumer.observer.once('close', () => {
							this.consumers.delete(consumer.id);
						});

						consumer.once('transportclose', () => {
							this.changeConsumer(consumer.id, 'close', false);
						});
	
						this.emit('consumerCreated', consumer, producerPaused);

						break;
					}

					case 'consumerPaused':
					case 'consumerResumed':
					case 'consumerClosed': {
						const { consumerId } = notification.data;
	
						await this.changeConsumer(
							consumerId,
							changeEvent[notification.method] as MediaChange,
							false
						);
						break;
					}

					case 'producerPaused':
					case 'producerResumed':
					case 'producerClosed': {
						const { producerId } = notification.data;

						await this.changeProducer(
							producerId,
							changeEvent[notification.method] as MediaChange,
							false
						);
						break;
					}
				}
			} catch (error) {
				logger.error('error on signalService "notification" event [error:%o]', error);
			}
		});
	}

	get mediaCapabilities(): MediaCapabilities {
		return {
			canSendMic: this.mediasoup.canProduce('audio'),
			canSendWebcam: this.mediasoup.canProduce('video'),
			canShareScreen: Boolean(navigator.mediaDevices.getDisplayMedia) &&
				this.mediasoup.canProduce('video')
		};
	}

	get rtpCapabilities(): RtpCapabilities {
		return this.mediasoup.rtpCapabilities;
	}

	public async changeConsumer(
		consumerId: string,
		change: MediaChange,
		local = true
	): Promise<void> {
		logger.debug(`${change}Consumer [consumerId:%s]`, consumerId);
		const consumer = this.consumers.get(consumerId);

		if (local && consumer) {
			await this.signalingService.sendRequest(`${change}Consumer`, { consumerId: consumer.id })
				.catch((error) => logger.warn(`${change}Consumer, unable to ${change} server-side [consumerId:%s, error:%o]`, consumerId, error));
		}

		if (!local) {
			this.emit(`consumer${changeEvent[change]}`, consumer);
		}

		consumer?.[`${change}`]();
	}

	public async changeProducer(
		producerId: string,
		change: MediaChange,
		local = true
	): Promise<void> {
		logger.debug(`${change}Producer [producerId:%s]`, producerId);
		const producer = this.producers.get(producerId);

		if (local && producer) {
			await this.signalingService.sendRequest(`${change}Producer`, { producerId: producer.id })
				.catch((error) => logger.warn(`${change}Producer, unable to ${change} server-side [producerId:%s, error:%o]`, producerId, error));
		}

		if (!local) {
			this.emit(`producer${changeEvent[change]}`, producer);
		}

		producer?.[`${change}`]();
	}

	public async createTransports(
		iceServers?: RTCIceServer[]
	): Promise<{
		sendTransport: Transport | undefined;
		recvTransport: Transport | undefined;
	}> {
		try {
			const routerRtpCapabilities = await this.signalingService.sendRequest('getRouterRtpCapabilities');

			await this.mediasoup.load({ routerRtpCapabilities });

			this.sendTransport = await this.createTransport('createSendTransport', iceServers);
			this.recvTransport = await this.createTransport('createRecvTransport', iceServers);
		} catch (error) {
			logger.error('error on starting mediasoup transports [error:%o]', error);
		}

		return {
			sendTransport: this.sendTransport,
			recvTransport: this.recvTransport,
		};
	}

	private async createTransport(
		creator: 'createSendTransport' | 'createRecvTransport',
		iceServers?: RTCIceServer[]
	): Promise<Transport> {
		const {
			id,
			iceParameters,
			iceCandidates,
			dtlsParameters,
		} = await this.signalingService.sendRequest('createWebRtcTransport', {
			forceTcp: false,
			producing: creator === 'createSendTransport',
			consuming: creator === 'createRecvTransport',
		});

		const transport = this.mediasoup[creator]({
			id,
			iceParameters,
			iceCandidates,
			dtlsParameters,
			iceServers
		});

		// eslint-disable-next-line no-shadow
		transport.on('connect', ({ dtlsParameters }, callback, errback) => {
			if (!transport)
				return;

			this.signalingService.sendRequest('connectWebRtcTransport', {
				transportId: transport.id,
				dtlsParameters,
			})
				.then(callback)
				.catch(errback);
		});

		transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
			if (!transport)
				return;

			this.signalingService.sendRequest('produce', {
				transportId: transport.id,
				kind,
				rtpParameters,
				appData,
			})
				.then(callback)
				.catch(errback);
		});

		return transport;
	}

	public async produce(producerOptions: ProducerOptions): Promise<Producer> {
		logger.debug('produce() [options:%o]', producerOptions);

		if (!this.sendTransport) {
			throw new Error('Producer can not be created without sendTransport');
		}

		const producer = await this.sendTransport.produce(producerOptions);

		this.producers.set(producer.id, producer);

		producer.observer.once('close', () => {
			this.producers.delete(producer.id);
		});

		producer.once('transportclose', () => {
			this.changeProducer(producer.id, 'close', false);
		});

		producer.once('trackended', () => {
			this.changeProducer(producer.id, 'close', false);
		});

		return producer;
	}
}