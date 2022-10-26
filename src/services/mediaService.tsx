import EventEmitter from 'events';
import { Device } from 'mediasoup-client';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer, ProducerOptions } from 'mediasoup-client/lib/Producer';
import { Transport } from 'mediasoup-client/lib/Transport';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { Logger } from '../utils/logger';
import { SignalingService } from './signalingService';
import hark from 'hark';
import { VolumeWatcher } from '../utils/volumeWatcher';
import { PeerTransport } from '../utils/peerTransport';
import { DataConsumer } from 'mediasoup-client/lib/DataConsumer';
import { DataProducer, DataProducerOptions } from 'mediasoup-client/lib/DataProducer';
import { ResolutionWatcher } from '../utils/resolutionWatcher';
import rtcstatsInit from '@jitsi/rtcstats/rtcstats';
import traceInit from '@jitsi/rtcstats/trace-ws';
import { RTCStatsMetaData, RTCStatsOptions } from '../utils/types';

const logger = new Logger('MediaService');

export type MediaChange = 'pause' | 'resume' | 'close';

export interface MediaCapabilities {
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
	canRecord: boolean;
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
	on(event: 'dataConsumerCreated', listener: (dataConsumer: DataConsumer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerClosed', listener: (consumer: Consumer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'dataConsumerClosed', listener: (dataConsumer: DataConsumer) => void): this;
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
	private dataConsumers: Map<string, DataConsumer> = new Map();
	private dataProducers: Map<string, DataProducer> = new Map();
	private tracks: Map<string, MediaStreamTrack> = new Map();
	private peerTransports: Map<string, PeerTransport> = new Map();
	private peers: string[] = [];
	private p2p = true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private trace: any;

	constructor({ signalingService }: { signalingService: SignalingService }) {
		super();

		this.signalingService = signalingService;
	}

	public init(): void {
		this.handleSignaling();
	}

	public close(): void {
		logger.debug('close()');

		// This will close all consumers and producers.
		this.sendTransport?.close();
		this.recvTransport?.close();

		for (const peerTransport of this.peerTransports.values()) {
			peerTransport.close();
		}
		
		this.peerTransports.clear();
		this.peers = [];

		for (const track of this.tracks.values()) {
			track.stop();
		}

		this.tracks.clear();
	}

	public getConsumer(consumerId: string): Consumer | undefined {
		return this.consumers.get(consumerId);
	}

	public getConsumers(): Consumer[] {
		return Array.from(this.consumers.values());
	}

	public getProducer(producerId: string): Producer | undefined {
		return this.producers.get(producerId);
	}

	public getProducers(): Producer[] {
		return Array.from(this.producers.values());
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

	public enableP2P(clientId: string): void {
		logger.debug('enableP2P()');

		this.p2p = true;

		this.peers.forEach((id) => {
			// Remote peer may have sent us an offer already
			if (this.peerTransports.has(id))
				return;

			const peerTransport = new PeerTransport({
				id,
				polite: String(id).localeCompare(clientId) > 0
			});

			this.handlePeerTransport(peerTransport);
		});
	}

	public disableP2P(): void {
		logger.debug('disableP2P()');

		this.p2p = false;

		this.peerTransports.forEach((peerTransport) => {
			peerTransport.close();
		});
	}

	public addPeer(id: string, clientId: string): void {
		logger.debug('addPeer() [id:%s]', id);

		if (this.peers.includes(id))
			return;

		this.peers.push(id);

		if (this.p2p) {
			let peerTransport = this.peerTransports.get(id);

			if (!peerTransport) {
				peerTransport = new PeerTransport({
					id,
					polite: String(id).localeCompare(clientId) > 0
				});

				this.handlePeerTransport(peerTransport);

				this.peerTransports.set(id, peerTransport);
			}
		}
	}

	public removePeer(id: string): void {
		logger.debug('removePeer() [id:%s]', id);

		if (!this.peers.includes(id))
			return;

		this.peers = this.peers.filter((peerId) => peerId !== id);

		if (this.p2p) {
			const peerTransport = this.peerTransports.get(id);

			if (peerTransport) {
				peerTransport.close();
				this.peerTransports.delete(id);
			}
		}
	}

	private handleSignaling(): void {
		this.signalingService.on('notification', async (notification) => {
			try {
				switch (notification.method) {
					case 'offer': {
						const { peerId, offer } = notification.data;

						let peerTransport = this.peerTransports.get(peerId);

						if (!peerTransport) {
							peerTransport = new PeerTransport({
								id: peerId,
								polite: String(peerId).localeCompare('clientId') > 0
							});
	
							this.handlePeerTransport(peerTransport);
						}

						await peerTransport.onRemoteOffer(offer);

						break;
					}

					case 'answer': {
						const { peerId, answer } = notification.data;

						const peerTransport = this.peerTransports.get(peerId);

						if (!peerTransport)
							throw new Error(`Peer transport "${peerId}" not found.`);

						await peerTransport.onRemoteAnswer(answer);

						break;
					}

					case 'candidate': {
						const { peerId, candidate } = notification.data;

						const peerTransport = this.peerTransports.get(peerId);

						if (!peerTransport)
							throw new Error(`Peer transport "${peerId}" not found.`);

						await peerTransport.onRemoteCandidate(candidate);

						break;
					}

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

						if (!this.recvTransport)
							throw new Error('Consumer can not be created without recvTransport');
	
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

						if (kind === 'audio') {
							await this.signalingService.sendRequest('resumeConsumer', { consumerId: consumer.id })
								.catch((error) => logger.warn('resumeConsumer, unable to resume server-side [consumerId:%s, error:%o]', consumer.id, error));

							const { track } = consumer;
							const harkStream = new MediaStream();

							harkStream.addTrack(track);

							const consumerHark = hark(harkStream, {
								play: false,
								interval: 100,
								threshold: -60, // TODO: get from state
								history: 100
							});

							consumer.appData.hark = consumerHark;
							consumer.appData.volumeWatcher = new VolumeWatcher({ hark: consumerHark });
						} else {
							const resolutionWatcher = new ResolutionWatcher();

							resolutionWatcher.on('newResolution', async (resolution) => {
								const { width } = resolution;
								const spatialLayer = width >= 480 ? width >= 960 ? 2 : 1 : 0;
								const temporalLayer = spatialLayer;

								await this.signalingService.sendRequest(
									'setConsumerPreferredLayers',
									{ consumerId: consumer.id, spatialLayer, temporalLayer }
								).catch((error) => logger.warn('setConsumerPreferredLayers, unable to set layers [consumerId:%s, error:%o]', consumer.id, error));
							});

							consumer.appData.resolutionWatcher = resolutionWatcher;
							consumer.pause();
						}

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

					case 'newDataConsumer': {
						const {
							peerId,
							dataProducerId,
							id,
							sctpStreamParameters,
							label,
							protocol,
							appData,
						} = notification.data;

						if (!this.recvTransport)
							throw new Error('DataConsumer can not be created without recvTransport');

						const dataConsumer = await this.recvTransport.consumeData({
							id,
							dataProducerId,
							sctpStreamParameters,
							label,
							protocol,
							appData: {
								...appData,
								peerId,
							},
						});

						this.dataConsumers.set(dataConsumer.id, dataConsumer);

						dataConsumer.observer.once('close', () => {
							this.dataConsumers.delete(dataConsumer.id);
						});

						dataConsumer.once('transportclose', () => {
							this.closeDataConsumer(dataConsumer.id);
						});

						this.emit('dataConsumerCreated', dataConsumer);

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
				this.mediasoup.canProduce('video'),
			canRecord: Boolean(MediaRecorder && window.showSaveFilePicker),
		};
	}

	get rtpCapabilities(): RtpCapabilities {
		return this.mediasoup.rtpCapabilities;
	}

	private handlePeerTransport(peerTransport: PeerTransport): void {
		logger.debug('handlePeerTransport() [peerTransport:%o]', peerTransport);

		this.peerTransports.set(peerTransport.id, peerTransport);

		peerTransport.on('offer', async (offer) => {
			logger.debug('peerTransport "offer" event [peerTransport:%s]', peerTransport.id);

			await this.signalingService.sendRequest('offer', { offer, peerId: peerTransport.id })
				.catch((error) => logger.warn('offer, unable to send [peerId:%s, error:%o]', peerTransport.id, error));
		});

		peerTransport.on('answer', async (answer) => {
			logger.debug('peerTransport "answer" event [peerTransport:%s]', peerTransport.id);

			await this.signalingService.sendRequest('answer', { answer, peerId: peerTransport.id })
				.catch((error) => logger.warn('answer, unable to send [peerId:%s, error:%o]', peerTransport.id, error));
		});

		peerTransport.on('candidate', async (candidate) => {
			logger.debug('peerTransport "iceCandidate" event [peerTransport:%s]', peerTransport.id);

			await this.signalingService.sendRequest('candidate', { candidate, peerId: peerTransport.id })
				.catch((error) => logger.warn('candidate, unable to send [peerId:%s, error:%o]', peerTransport.id, error));
		});
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

		if (!local)
			this.emit(`consumer${changeEvent[change]}`, consumer);

		consumer?.[`${change}`]();
	}

	public async closeDataConsumer(
		dataConsumerId: string,
		local = true
	): Promise<void> {
		logger.debug('closeDataConsumer [dataConsumerId:%s]', dataConsumerId);

		const dataConsumer = this.dataConsumers.get(dataConsumerId);

		if (local && dataConsumer) {
			await this.signalingService.sendRequest('closeDataConsumer', { dataConsumerId: dataConsumer.id })
				.catch((error) => logger.warn('closeDataConsumer, unable to close server-side [dataConsumerId:%s, error:%o]', dataConsumerId, error));
		}

		if (!local)
			this.emit('dataConsumerClosed', dataConsumer);

		dataConsumer?.close();
	}

	public async changeProducer(
		producerId: string,
		change: MediaChange,
		local = true,
		notifyAll = false
	): Promise<void> {
		logger.debug(`${change}Producer [producerId:%s]`, producerId);

		const producer = this.producers.get(producerId);

		if ((local || notifyAll) && producer) {
			await this.signalingService.sendRequest(`${change}Producer`, { producerId: producer.id })
				.catch((error) => logger.warn(`${change}Producer, unable to ${change} server-side [producerId:%s, error:%o]`, producerId, error));
		}

		if (!local || notifyAll)
			this.emit(`producer${changeEvent[change]}`, producer);

		producer?.[`${change}`]();
	}

	public async closeDataProducer(
		dataProducerId: string,
		local = true
	): Promise<void> {
		logger.debug('closeDataProducer [dataProducerId:%s]', dataProducerId);

		const dataProducer = this.dataProducers.get(dataProducerId);

		if (local && dataProducer) {
			await this.signalingService.sendRequest('closeDataProducer', { dataProducerId: dataProducer.id })
				.catch((error) => logger.warn('closeDataProducer, unable to close server-side [dataProducerId:%s, error:%o]', dataProducerId, error));
		}

		dataProducer?.close();
	}

	public async createTransports(
		iceServers?: RTCIceServer[]
	): Promise<{
		sendTransport: Transport | undefined;
		recvTransport: Transport | undefined;
	}> {
		try {
			if (!this.mediasoup.loaded) {
				const { routerRtpCapabilities } = await this.signalingService.sendRequest('getRouterRtpCapabilities');
	
				await this.mediasoup.load({ routerRtpCapabilities });
			}

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
			sctpParameters,
		} = await this.signalingService.sendRequest('createWebRtcTransport', {
			forceTcp: false,
			producing: creator === 'createSendTransport',
			consuming: creator === 'createRecvTransport',
			sctpCapabilities: this.mediasoup.sctpCapabilities,
		});

		const transport = this.mediasoup[creator]({
			id,
			iceParameters,
			iceCandidates,
			dtlsParameters,
			sctpParameters,
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

		transport.on('producedata', async (
			{
				sctpStreamParameters,
				label,
				protocol,
				appData
			},
			callback,
			errback
		) => {
			if (!transport)
				return;

			this.signalingService.sendRequest('produceData', {
				transportId: transport.id,
				sctpStreamParameters,
				label,
				protocol,
				appData,
			})
				.then(callback)
				.catch(errback);
		});

		return transport;
	}

	public async produce(producerOptions: ProducerOptions): Promise<Producer> {
		logger.debug('produce() [options:%o]', producerOptions);

		if (!this.sendTransport)
			throw new Error('Producer can not be created without sendTransport');

		const producer = await this.sendTransport.produce(producerOptions);

		const { kind, track } = producer;

		if (kind === 'audio' && track) {
			const harkStream = new MediaStream();

			harkStream.addTrack(track.clone());

			const producerHark = hark(harkStream, {
				play: false,
				interval: 100,
				threshold: -60, // TODO: get from state
				history: 100
			});

			producer.appData.hark = producerHark;
			producer.appData.volumeWatcher = new VolumeWatcher({ hark: producerHark });
		}

		this.producers.set(producer.id, producer);
		producer.observer.once('close', () => this.producers.delete(producer.id));
		producer.once('transportclose', () => this.changeProducer(producer.id, 'close', false));
		producer.once('trackended', () => this.changeProducer(producer.id, 'close', true, true));

		return producer;
	}

	public async produceData(
		dataProducerOptions: DataProducerOptions
	): Promise<DataProducer> {
		logger.debug('produceData() [options:%o]', dataProducerOptions);

		if (!this.sendTransport)
			throw new Error('DataProducer can not be created without sendTransport');

		const dataProducer = await this.sendTransport.produceData(dataProducerOptions);

		this.dataProducers.set(dataProducer.id, dataProducer);

		dataProducer.observer.once('close', () =>
			this.dataProducers.delete(dataProducer.id));

		dataProducer.once('transportclose', () =>
			this.closeDataProducer(dataProducer.id, false));

		return dataProducer;
	}

	private rtcStatsCloseCallback() {
		logger.debug('rtcStatsCloseCallback()');
	}

	public rtcStatsInit(rtcStatsOptions?: RTCStatsOptions): void {
		if (!rtcStatsOptions)
			return;

		const {
			url: endpoint,
			useLegacy,
			obfuscate = true,
			wsPingIntervalMs: pingInterval = 30000,
			pollIntervalMs: pollInterval,
		} = rtcStatsOptions;

		if (!endpoint) {
			logger.warn('rtcStatsInit() | no endpoint given, not starting rtcstats');

			return;
		}

		const traceOptions = {
			endpoint,
			meetingFqn: window.location.pathname.replace(/^\//, ''),
			onCloseCallback: this.rtcStatsCloseCallback.bind(this),
			useLegacy,
			obfuscate,
			pingInterval,
		};

		const rtcStatsInternalOptions = {
			pollInterval,
			useLegacy,
		};

		try {
			this.trace = traceInit(traceOptions);
			rtcstatsInit(this.trace, rtcStatsInternalOptions);
			this.trace?.connect();
		} catch (error) {
			logger.error('rtcStatsInit() [error:%o]', error);
		}
	}

	public rtcStatsIdentity(rtcStatsMetaData: RTCStatsMetaData): void {
		try {
			this.trace?.identity('identity', null, rtcStatsMetaData);
		} catch (error) {
			logger.error('rtcStatsIdentity() [error:%o]', error);
		}
	}
}