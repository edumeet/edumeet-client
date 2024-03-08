import EventEmitter from 'events';
import type { Device } from 'mediasoup-client';
import { Device as PeerDevice } from 'ortc-p2p/src/Device';
import type { Consumer as PeerConsumer } from 'ortc-p2p/src/Consumer';
import type { Producer as PeerProducer } from 'ortc-p2p/src/Producer';
import type { Transport as PeerTransport } from 'ortc-p2p/src/Transport';
import type { Consumer } from 'mediasoup-client/lib/Consumer';
import type { Producer, ProducerOptions } from 'mediasoup-client/lib/Producer';
import type { Transport } from 'mediasoup-client/lib/Transport';
import type { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { SignalingService } from './signalingService';
import hark from 'hark';
import { VolumeWatcher } from '../utils/volumeWatcher';
import type { DataConsumer } from 'mediasoup-client/lib/DataConsumer';
import type { DataProducer, DataProducerOptions } from 'mediasoup-client/lib/DataProducer';
import { ResolutionWatcher } from '../utils/resolutionWatcher';
import { Logger } from 'edumeet-common';
import { safePromise } from '../utils/safePromise';
import { ProducerSource } from '../utils/types';

const logger = new Logger('MediaService');

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		webkitSpeechRecognition: any;
	}
}

export type ProducerCodec = 'video/vp8' | 'video/vp9' | 'video/h264' | 'audio/opus';
export type MediaChange = 'pause' | 'resume' | 'close';

export interface MediaCapabilities {
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
}

export interface LocalCapabilities {
	canRecord: boolean;
	canTranscribe: boolean;
}

export interface PeerTranscript {
	id: string;
	transcript: string;
	peerId: string;
	done: boolean;
}

type Producers = {
	// eslint-disable-next-line no-unused-vars
	[key in ProducerSource]?: Producer;
};

type ProducersTracks = {
	// eslint-disable-next-line no-unused-vars
	[key in ProducerSource]?: MediaStreamTrack;
};

export type Transcript = Omit<PeerTranscript, 'peerId'>;

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
	peerCloseProducer: 'close',
	peerPauseProducer: 'pause',
	peerResumeProducer: 'resume',
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface MediaService {
	// eslint-disable-next-line no-unused-vars
	on(event: 'consumerCreated', listener: (consumer: Consumer, paused: boolean, producerPaused: boolean, peerConsumer: boolean) => void): this;
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
	on(event: 'consumerScore', listener: (consumerId: string, score: number) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerClosed', listener: (producer: Producer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerPaused', listener: (producer: Producer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerResumed', listener: (producer: Producer) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'producerScore', listener: (producerId: string, score: number) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'transcriptionStarted', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'transcriptionStopped', listener: () => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'transcript', listener: (transcription: PeerTranscript) => void): this;
	// eslint-disable-next-line no-unused-vars
	on(event: 'lostMediaServer', listener: () => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MediaService extends EventEmitter {
	private signalingService: SignalingService;

	private mediasoup?: Device;
	public iceServers: RTCIceServer[] = [];
	private sendTransport: Transport | undefined;
	private recvTransport: Transport | undefined;
	private consumers: Map<string, Consumer | PeerConsumer> = new Map();
	private consumerCreationState: Map<string, { paused: boolean; closed: boolean; }> = new Map();
	private dataConsumers: Map<string, DataConsumer> = new Map();
	private dataProducers: Map<string, DataProducer> = new Map();

	public previewMicTrack?: MediaStreamTrack;
	public previewWebcamTrack?: MediaStreamTrack;

	public producers: Producers = {};
	public peerProducers: Record<ProducerSource, Map<string, PeerProducer>> = {
		mic: new Map(),
		webcam: new Map(),
		screen: new Map(),
		screenaudio: new Map(),
		extravideo: new Map(),
		extraaudio: new Map(),
	};

	public tracks: ProducersTracks = {};

	private peerDevices: Map<string, PeerDevice> = new Map(); // PeerId -> P2PDevice
	private peerSendTransports: Map<string, Promise<PeerTransport>> = new Map(); // PeerId -> P2PTransport
	private peerRecvTransports: Map<string, Promise<PeerTransport>> = new Map(); // PeerId -> P2PTransport

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private speechRecognition?: any;
	private speechRecognitionRunning = false;
	
	// eslint-disable-next-line no-unused-vars
	public rejectMediaReady!: (error: Error) => void;
	public resolveMediaReady!: () => void;
	public mediaReady!: ReturnType<typeof safePromise>;

	// eslint-disable-next-line no-unused-vars
	public rejectTransportsReady!: (error: Error) => void;
	public resolveTransportsReady!: () => void;
	public transportsReady!: ReturnType<typeof safePromise>;

	constructor({ signalingService }: { signalingService: SignalingService }) {
		super();

		this.signalingService = signalingService;

		this.reset();
	}

	public init(): void {
		this.handleSignaling();
	}

	private reset(): void {
		this.mediasoup = undefined;
		this.iceServers = [];

		this.rejectMediaReady?.(new Error('MediaService has been reset'));

		this.mediaReady = safePromise(new Promise<void>((resolve, reject) => {
			this.resolveMediaReady = resolve;
			this.rejectMediaReady = reject;
		}));

		this.rejectTransportsReady?.(new Error('MediaService has been reset'));

		this.transportsReady = safePromise(new Promise<void>((resolve, reject) => {
			this.resolveTransportsReady = resolve;
			this.rejectTransportsReady = reject;
		}));

		this.createTransports().catch((error) => logger.error('error on creating transports [error:%o]', error));
	}

	public close(): void {
		logger.debug('close()');

		// This will close all consumers and producers.
		this.sendTransport?.close();
		this.recvTransport?.close();
	}

	public getConsumer(consumerId: string): Consumer | PeerConsumer | undefined {
		return this.consumers.get(consumerId);
	}

	public getConsumers(): (Consumer | PeerConsumer)[] {
		return Array.from(this.consumers.values());
	}

	private handleSignaling(): void {
		this.signalingService.on('request', async (request, respond, reject) => {
			try {
				switch (request.method) {
					case 'mediaConfiguration': {
						const { routerRtpCapabilities, iceServers } = request.data;

						this.iceServers = iceServers;

						const { rtpCapabilities, sctpCapabilities } = await this.receiveRouterRtpCapabilities(routerRtpCapabilities);

						respond({ rtpCapabilities, sctpCapabilities });

						this.resolveMediaReady();

						break;
					}

					default: {
						reject(`unknown method "${request.method}"`);
					}
				}
			} catch (error) {
				logger.error('error on signalService "request" event [error:%o]', error);

				reject(error);
			}
		});

		this.signalingService.on('notification', async (notification) => {
			try {
				switch (notification.method) {
					case 'peerClosed': {
						const { peerId } = notification.data;

						const peerSendTransport = this.peerSendTransports.get(peerId);
						const peerRecvTransport = this.peerRecvTransports.get(peerId);

						if (peerSendTransport) peerSendTransport.then((transport) => transport.close());
						if (peerRecvTransport) peerRecvTransport.then((transport) => transport.close());

						this.peerSendTransports.delete(peerId);
						this.peerRecvTransports.delete(peerId);
						this.peerDevices.delete(peerId);

						break;
					}

					case 'peerLoad': {
						const { peerId, rtpCapabilities } = notification.data;

						const peerDevice = this.getPeerDevice(peerId);
						
						await peerDevice.load({ remoteRtpCapabilities: rtpCapabilities });

						break;
					}

					case 'peerConnect': {
						const { peerId, dtlsParameters, iceParameters, direction } = notification.data;

						if (direction === 'recv') {
							const p2pSendTransport = await this.getPeerSendTransport(peerId);

							await p2pSendTransport.connect({ dtlsParameters, iceParameters });
						} else {
							const p2pRecvTransport = await this.getPeerRecvTransport(peerId);

							await p2pRecvTransport.connect({ dtlsParameters, iceParameters });
						}

						break;
					}

					case 'candidate': {
						const { peerId, candidate, direction } = notification.data;

						if (direction === 'recv') {
							const p2pSendTransport = await this.getPeerSendTransport(peerId);

							await p2pSendTransport.addIceCandidate({ candidate });
						} else {
							const p2pRecvTransport = await this.getPeerRecvTransport(peerId);

							await p2pRecvTransport.addIceCandidate({ candidate });
						}

						break;
					}

					case 'peerProduce': {
						const { peerId, id, kind, rtpParameters, appData } = notification.data;

						const peerTransport = await this.getPeerRecvTransport(peerId);

						const peerConsumer = await peerTransport.consume({
							id,
							kind,
							rtpParameters,
							appData: {
								...appData,
								peerId,
								peerConsumer: true,
							},
						});

						if (kind === 'audio') {
							const { track } = peerConsumer;
							const harkStream = new MediaStream();

							harkStream.addTrack(track);

							const consumerHark = hark(harkStream, {
								play: false,
								interval: 50,
								threshold: -60,
								history: 100
							});

							peerConsumer.appData.hark = consumerHark;
							peerConsumer.appData.volumeWatcher = new VolumeWatcher({ hark: consumerHark });
						}

						this.consumers.set(peerConsumer.id, peerConsumer);
						peerConsumer.observer.once('close', () => this.consumers.delete(peerConsumer.id));
						peerConsumer.once('transportclose', () => this.changeConsumer(peerConsumer.id, 'close', false));

						this.emit('consumerCreated', peerConsumer, false, false, true);

						break;
					}

					case 'peerCloseProducer':
					case 'peerPauseProducer':
					case 'peerResumeProducer': {
						const { producerId } = notification.data;

						this.changeConsumer(producerId, changeEvent[notification.method] as MediaChange, false);

						break;
					}

					case 'pausePeerConsumer':
					case 'resumePeerConsumer': {
						// const { consumerId } = notification.data;

						// TODO: Implement this

						break;
					}

					case 'newConsumer': {
						const {
							peerId,
							producerId,
							id,
							kind,
							rtpParameters,
							appData,
							producerPaused,
							paused
						} = notification.data;

						if (!this.recvTransport)
							throw new Error('Consumer can not be created without recvTransport');

						const source = appData.source as ProducerSource;

						let streamId: string;

						if (source === 'mic' || source === 'webcam') {
							streamId = `${peerId}-main`;
						} else if (source === 'screen' || source === 'screenaudio') {
							streamId = `${peerId}-screen`;
						} else {
							streamId = `${peerId}-${kind}`;
						}

						this.consumerCreationState.set(id, { paused: producerPaused, closed: false });

						const consumer = await this.recvTransport.consume({
							id,
							producerId,
							streamId,
							kind,
							rtpParameters,
							appData: {
								...appData,
								peerId,
							},
						});

						const {
							paused: consumerPaused,
							closed,
						} = this.consumerCreationState.get(id) || {} as { paused: boolean; closed: boolean };

						if (closed) {
							this.consumerCreationState.delete(id);
							consumer.close();

							return;
						}

						if (kind === 'audio') {
							const { track } = consumer;
							const harkStream = new MediaStream();

							harkStream.addTrack(track);

							const consumerHark = hark(harkStream, {
								play: false,
								interval: 50,
								threshold: -60,
								history: 100
							});

							consumer.appData.hark = consumerHark;
							consumer.appData.volumeWatcher = new VolumeWatcher({ hark: consumerHark });
						} else {
							const resolutionWatcher = new ResolutionWatcher();

							let lastSpatialLayer = 2;

							resolutionWatcher.on('newResolution', (resolution) => {
								const { width } = resolution;
								const spatialLayer = width >= 480 ? width >= 960 ? 2 : 1 : 0;
								const temporalLayer = 2;

								if (spatialLayer === lastSpatialLayer)
									return;

								lastSpatialLayer = spatialLayer;

								this.signalingService.notify('setConsumerPreferredLayers', { consumerId: consumer.id, spatialLayer, temporalLayer });
							});

							consumer.appData.resolutionWatcher = resolutionWatcher;
						}

						this.consumers.set(consumer.id, consumer);
						consumer.observer.once('close', () => this.consumers.delete(consumer.id));
						consumer.once('transportclose', () => this.changeConsumer(consumer.id, 'close', false));
						this.emit('consumerCreated', consumer, paused, consumerPaused, false);

						this.consumerCreationState.delete(id);

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
						dataConsumer.observer.once('close', () => this.dataConsumers.delete(dataConsumer.id));
						dataConsumer.once('transportclose', () => this.closeDataConsumer(dataConsumer.id, false));

						dataConsumer.on('message', (message) => {
							if (typeof message !== 'string') return;

							const { method, data } = JSON.parse(message);

							switch (method) {
								case 'transcript': {
									const { transcript, id: transcriptionId, done } = data;

									this.emit('transcript', { id: transcriptionId, transcript, peerId, done });

									break;
								}

								default: {
									logger.warn('unknown dataConsumer method "%s"', method);
								}
							}
						});

						this.emit('dataConsumerCreated', dataConsumer);

						break;
					}

					case 'consumerPaused':
					case 'consumerResumed':
					case 'consumerClosed': {
						const { consumerId } = notification.data;

						const consumer = this.consumers.get(consumerId);

						if (!consumer) {
							const consumerCreationState = this.consumerCreationState.get(consumerId);

							if (consumerCreationState) {
								if (notification.method === 'consumerClosed') consumerCreationState.closed = true;
								if (notification.method === 'consumerPaused') consumerCreationState.paused = true;

								return;
							}

							throw new Error('consumer not found');
						}
	
						this.changeConsumer(consumerId, changeEvent[notification.method] as MediaChange, false);

						break;
					}

					case 'dataConsumerClosed': {
						const { dataConsumerId } = notification.data;

						this.closeDataConsumer(dataConsumerId, false);

						break;
					}

					case 'producerClosed': {
						const { producerId } = notification.data;

						this.closeProducer(producerId, false);

						break;
					}

					case 'newProducerLayer': {
						const { producerId, spatialLayer } = notification.data;

						const producer = Object.values(this.producers).find((p) => p.id === producerId);

						if (!producer)
							throw new Error('producer not found');

						producer.setMaxSpatialLayer(spatialLayer);

						break;
					}

					case 'consumerScore': {
						const { consumerId, score: { score } } = notification.data;

						this.emit('consumerScore', consumerId, score);

						break;
					}

					case 'transportClosed': {
						const { transportId } = notification.data;

						if (this.sendTransport?.id === transportId) {
							this.sendTransport?.close();
							this.sendTransport = undefined;
						} else if (this.recvTransport?.id === transportId) {
							this.recvTransport?.close();
							this.recvTransport = undefined;
						}

						break;
					}

					case 'lostMediaServer': {
						this.reset();
						this.emit('lostMediaServer');

						break;
					}

					case 'noMediaServer': {
						logger.error('no media server available');

						break;
					}
				}
			} catch (error) {
				logger.error('error on signalService "notification" event [error:%o]', error);
			}
		});
	}

	get mediaCapabilities(): MediaCapabilities | undefined {
		if (!this.mediasoup) return;

		return {
			canSendMic: this.mediasoup.canProduce('audio'),
			canSendWebcam: this.mediasoup.canProduce('video'),
			canShareScreen: Boolean(navigator.mediaDevices.getDisplayMedia) && this.mediasoup.canProduce('video'),
		};
	}

	get localCapabilities(): LocalCapabilities {
		return {
			canRecord: Boolean(MediaRecorder && window.showSaveFilePicker),
			canTranscribe: Boolean(window.webkitSpeechRecognition),
		};
	}

	get rtpCapabilities(): RtpCapabilities | undefined {
		return this.mediasoup?.rtpCapabilities;
	}

	public changeConsumer(consumerId: string, change: MediaChange, local = true): void {
		logger.debug(`${change}Consumer [consumerId: %s, local: %s]`, consumerId, local);

		const consumer = this.consumers.get(consumerId);

		if (local && consumer) {
			if (consumer.appData.peerConsumer) {
				this.signalingService.notify(`${change}PeerConsumer`, { consumerId: consumer.id });
			} else {
				this.signalingService.notify(`${change}Consumer`, { consumerId: consumer.id });
			}
		}

		if (!local) this.emit(`consumer${changeEvent[change]}`, consumer);

		consumer?.[`${change}`]();
	}

	public closeDataConsumer(dataConsumerId: string, local = true): void {
		logger.debug('closeDataConsumer [dataConsumerId:%s]', dataConsumerId);

		const dataConsumer = this.dataConsumers.get(dataConsumerId);

		if (local && dataConsumer) {
			this.signalingService.notify('closeDataConsumer', { dataConsumerId: dataConsumer.id });
		}

		if (!local) this.emit('dataConsumerClosed', dataConsumer);

		dataConsumer?.close();
	}

	public closeProducer(source: ProducerSource, local = true, notifyAll = false): void {
		logger.debug('closeProducer() [source:%s]', source);

		const producer = this.producers[source];
	
		if ((local || notifyAll) && producer) {
			this.signalingService.notify('closeProducer', { producerId: producer.id });
		}

		if (producer?.kind === 'audio')
			this.stopTranscription();

		if (!local || notifyAll) this.emit('producerClosed', producer);

		producer?.close();
	}

	public closeDataProducer(dataProducerId: string, local = true): void {
		logger.debug('closeDataProducer [dataProducerId:%s]', dataProducerId);

		const dataProducer = this.dataProducers.get(dataProducerId);

		if (local && dataProducer) {
			this.signalingService.notify('closeDataProducer', { dataProducerId: dataProducer.id });
		}

		dataProducer?.close();
	}

	private async receiveRouterRtpCapabilities(routerRtpCapabilities: RtpCapabilities): Promise<Device> {
		logger.debug('receiveRouterRtpCapabilities()');

		if (!this.mediasoup) {
			const MediaSoup = await import('mediasoup-client');

			this.mediasoup = new MediaSoup.Device();
		}

		if (!this.mediasoup.loaded) await this.mediasoup.load({ routerRtpCapabilities });

		return this.mediasoup;
	}

	public async createTransports(): Promise<void> {
		await this.mediaReady;
		
		this.sendTransport = await this.createTransport('createSendTransport');
		this.recvTransport = await this.createTransport('createRecvTransport');

		this.resolveTransportsReady();
	}

	private async createTransport(creator: 'createSendTransport' | 'createRecvTransport'): Promise<Transport> {
		if (!this.mediasoup) throw new Error('mediasoup not initialized');

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
			iceServers: this.iceServers,
		});

		// eslint-disable-next-line no-shadow
		transport.on('connect', ({ dtlsParameters }, callback, errback) => {
			if (!transport) return;

			this.signalingService.sendRequest('connectWebRtcTransport', {
				transportId: transport.id,
				dtlsParameters,
			})
				.then(callback)
				.catch(errback);
		});

		transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
			if (!transport) return;

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
			if (!transport) return;

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

	public async produce(source: ProducerSource, producerOptions: ProducerOptions, codec?: ProducerCodec): Promise<Producer> {
		logger.debug('produce() [options:%o]', producerOptions);

		await this.transportsReady;

		if (!this.sendTransport) throw new Error('Producer can not be created without sendTransport');

		const producer = await this.sendTransport.produce({
			...producerOptions,
			codec: this.mediasoup?.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === codec)
		});

		const { kind, track } = producer;

		if (kind === 'audio' && track) {
			const harkStream = new MediaStream();

			harkStream.addTrack(track.clone());

			const producerHark = hark(harkStream, {
				play: false,
				interval: 100,
				threshold: -60,
				history: 100
			});

			producer.appData.hark = producerHark;
			producer.appData.volumeWatcher = new VolumeWatcher({ hark: producerHark });
		}

		this.producers[source] = producer;

		producer.observer.once('close', () => delete this.producers[source]);
		producer.observer.on('pause', () => this.signalingService.notify('pauseProducer', { producerId: producer.id }));
		producer.observer.on('resume', () => this.signalingService.notify('resumeProducer', { producerId: producer.id }));
		producer.once('transportclose', () => this.closeProducer(source, false));
		producer.once('trackended', () => this.closeProducer(source, true, true));

		return producer;
	}

	public async produceData(dataProducerOptions: DataProducerOptions): Promise<DataProducer> {
		logger.debug('produceData() [options:%o]', dataProducerOptions);

		if (!this.sendTransport) throw new Error('DataProducer can not be created without sendTransport');

		const dataProducer = await this.sendTransport.produceData(dataProducerOptions);

		this.dataProducers.set(dataProducer.id, dataProducer);

		dataProducer.observer.once('close', () => this.dataProducers.delete(dataProducer.id));
		dataProducer.once('transportclose', () => this.closeDataProducer(dataProducer.id, false));

		return dataProducer;
	}

	public async peerProduce(peerId: string, source: ProducerSource, producerOptions: ProducerOptions, codec?: ProducerCodec): Promise<PeerProducer> {
		logger.debug('p2pProduce() [peerId:%s, options:%o]', peerId, producerOptions);

		const peerDevice = this.getPeerDevice(peerId);
		const transport = await this.getPeerSendTransport(peerId);
		
		const producer = await transport.produce({
			...producerOptions,
			codec: peerDevice.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === codec)
		});

		producer.appData.peerProducer = true;
		producer.appData.peerId = peerId;

		this.peerProducers[source].set(peerId, producer);
		
		producer.observer.once('close', () => {
			this.signalingService.notify('peerCloseProducer', { producerId: producer.id, peerId });

			this.peerProducers[source].delete(peerId);
		});

		producer.observer.on('pause', () => this.signalingService.notify('peerPauseProducer', { producerId: producer.id, peerId }));
		producer.observer.on('resume', () => this.signalingService.notify('peerResumeProducer', { producerId: producer.id, peerId }));
		producer.once('trackended', () => producer.close());

		return producer;
	}

	private getPeerDevice(peerId: string): PeerDevice {
		let p2pDevice = this.peerDevices.get(peerId);

		if (!p2pDevice) {
			p2pDevice = new PeerDevice();

			this.peerDevices.set(peerId, p2pDevice);

			(async () => {
				const rtpCapabilities = await p2pDevice.getRtpCapabilities();

				this.signalingService.notify('peerLoad', { peerId, rtpCapabilities });
			})();
		}

		return p2pDevice;
	}

	private async getPeerRecvTransport(peerId: string): Promise<PeerTransport> {
		let p2pRecvTransport = this.peerRecvTransports.get(peerId);

		if (!p2pRecvTransport) {
			p2pRecvTransport = (async () => {
				const p2pDevice = this.getPeerDevice(peerId);

				await p2pDevice.ready;
				await this.mediaReady;

				const transport = p2pDevice.createRecvTransport({
					iceServers: this.iceServers,
				});

				transport.on('icecandidate', (candidate) => {
					this.signalingService.notify('candidate', {
						peerId,
						candidate,
						direction: 'recv',
					});
				});

				transport.on('connect', ({ dtlsParameters, iceParameters }, callback, errback) => {
					this.signalingService.sendRequest('peerConnect', {
						peerId,
						dtlsParameters,
						iceParameters,
						direction: 'recv'
					})
						.then(callback)
						.catch(errback);
				});

				return transport;
			})();

			this.peerRecvTransports.set(peerId, p2pRecvTransport);
		}

		return p2pRecvTransport;
	}

	private async getPeerSendTransport(peerId: string): Promise<PeerTransport> {
		let p2pSendTransport = this.peerSendTransports.get(peerId);

		if (!p2pSendTransport) {
			p2pSendTransport = (async () => {
				const p2pDevice = this.getPeerDevice(peerId);

				await p2pDevice.ready;
				await this.mediaReady;

				const transport = p2pDevice.createSendTransport({
					iceServers: this.iceServers,
				});
				
				transport.on('icecandidate', (candidate) => {
					this.signalingService.notify('candidate', {
						peerId,
						candidate,
						direction: 'send',
					});
				});

				transport.on('connect', ({ dtlsParameters, iceParameters }, callback, errback) => {
					this.signalingService.sendRequest('peerConnect', {
						peerId,
						dtlsParameters,
						iceParameters,
						direction: 'send'
					})
						.then(callback)
						.catch(errback);
				});

				transport.on('produce', ({ id, kind, rtpParameters, appData }) => {
					this.signalingService.notify('peerProduce', {
						id,
						peerId,
						kind,
						rtpParameters,
						appData,
					});
				});

				return transport;
			})();

			this.peerSendTransports.set(peerId, p2pSendTransport);
		}

		return p2pSendTransport;
	}

	public async startTranscription(): Promise<void> {
		if (!window.webkitSpeechRecognition) return logger.warn('startTranscription() | SpeechRecognition not supported');
		if (this.speechRecognitionRunning) return logger.warn('startTranscription() | SpeechRecognition already started');

		const dataProducer = await this.produceData({
			ordered: false,
			maxPacketLifeTime: 3000,
			label: 'transcription',
		});

		this.speechRecognition = new window.webkitSpeechRecognition();

		this.speechRecognition.continuous = true;
		this.speechRecognition.interimResults = true;

		let transcriptId = Math.round(Math.random() * 10000000);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.speechRecognition.onresult = (event: any) => {
			logger.debug('speech "onresult" [event:%o]', event);

			let isFinal = false;
			let speechResult = '';

			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal)
					isFinal = true;

				speechResult += event.results[i][0].transcript;
			}

			const data = JSON.stringify({
				method: 'transcript',
				data: {
					id: transcriptId,
					transcript: speechResult,
					done: isFinal
				}
			});

			try {
				dataProducer.send(data);
			} catch (error) {
				logger.error('dataProducer error sending message [error:%o]', error);
			}

			if (isFinal) { // We want to send the transcript now
				logger.debug('speech final result [transcript:%s]', speechResult);

				transcriptId = Math.round(Math.random() * 10000000);
			} else
				logger.debug('speech interim result [transcript:%s]', speechResult);
		};

		this.speechRecognition.onend = () => {
			logger.debug('speech "onend"');

			if (this.speechRecognitionRunning)
				this.speechRecognition.start();
			else
				this.closeDataProducer(dataProducer.id, true);
		};

		this.speechRecognition.onerror = (event: Event) => {
			logger.error('speech "onerror" [event:%o]', event);

			if (this.speechRecognitionRunning)
				this.speechRecognition.start();
		};

		this.speechRecognitionRunning = true;
		this.speechRecognition.start();

		this.emit('transcriptionStarted');
	}

	public stopTranscription(): void {
		if (!this.speechRecognitionRunning) return logger.debug('stopTranscription() | SpeechRecognition not started');

		this.speechRecognitionRunning = false;
		this.speechRecognition.stop();
		delete this.speechRecognition.onend;
		delete this.speechRecognition.onresult;
		this.speechRecognition = undefined;

		this.emit('transcriptionStopped');
	}
}
