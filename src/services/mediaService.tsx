import EventEmitter from 'events';
import type { Device } from 'mediasoup-client';
import { Device as PeerDevice } from 'ortc-p2p/src/Device';
import type { Consumer as PeerConsumer } from 'ortc-p2p/src/Consumer';
import type { Transport as PeerTransport } from 'ortc-p2p/src/Transport';
import type { Consumer } from 'mediasoup-client/lib/Consumer';
import type { Transport } from 'mediasoup-client/lib/Transport';
import type { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { SignalingService } from './signalingService';
import hark from 'hark';
import { VolumeWatcher } from '../utils/volumeWatcher';
import type { DataConsumer } from 'mediasoup-client/lib/DataConsumer';
import type { DataProducer, DataProducerOptions } from 'mediasoup-client/lib/DataProducer';
import { ResolutionWatcher } from '../utils/resolutionWatcher';
import { ClientMonitor } from '@observertc/client-monitor-js';
import { safePromise } from '../utils/safePromise';
import { ProducerSource } from '../utils/types';
import { MediaSender } from '../utils/mediaSender';
import { Logger } from '../utils/Logger';
import edumeetConfig from '../utils/edumeetConfig';
import { fileService } from '../store/store';

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

type MediaSenders = {
	// eslint-disable-next-line no-unused-vars
	[key in ProducerSource]: MediaSender;
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
	on(event: 'mediaClosed', listener: (source: ProducerSource) => void): this;
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

	public mediasoup?: Device;
	public iceServers: RTCIceServer[] = [];
	public sendTransport: Transport | undefined;
	public recvTransport: Transport | undefined;
	private consumers: Map<string, Consumer | PeerConsumer> = new Map();
	private consumerCreationState: Map<string, { paused: boolean; closed: boolean; }> = new Map();
	private dataConsumers: Map<string, DataConsumer> = new Map();
	private dataProducers: Map<string, DataProducer> = new Map();

	public previewMicTrack: MediaStreamTrack | null = null;
	public previewWebcamTrack: MediaStreamTrack | null = null;

	public mediaSenders: MediaSenders;

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

	public _monitor: Promise<ClientMonitor> = (async () => {
		const { createClientMonitor } = await import('@observertc/client-monitor-js');

		const monitor = createClientMonitor({ collectingPeriodInMs: 5000 });

		return monitor;
	})();

	constructor(
		{ signalingService }: { signalingService: SignalingService },
		// eslint-disable-next-line no-unused-vars
		public readonly monitor?: ClientMonitor,		
	) {
		super();

		this.signalingService = signalingService;

		this.mediaSenders = {
			mic: new MediaSender(this, this.signalingService, 'mic').on('closed', () => this.emit('mediaClosed', 'mic')),
			webcam: new MediaSender(this, this.signalingService, 'webcam').on('closed', () => this.emit('mediaClosed', 'webcam')),
			screen: new MediaSender(this, this.signalingService, 'screen').on('closed', () => this.emit('mediaClosed', 'screen')),
			screenaudio: new MediaSender(this, this.signalingService, 'screenaudio').on('closed', () => this.emit('mediaClosed', 'screenaudio')),
			extravideo: new MediaSender(this, this.signalingService, 'extravideo').on('closed', () => this.emit('mediaClosed', 'extravideo')),
			extraaudio: new MediaSender(this, this.signalingService, 'extraaudio').on('closed', () => this.emit('mediaClosed', 'extraaudio')),
		};

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

	public setP2PMode(p2pMode: boolean): void {
		logger.debug('setP2PMode() [p2pMode:%s]', p2pMode);

		for (const mediaSender of Object.values(this.mediaSenders)) {
			if (p2pMode) mediaSender.startP2P();
			else mediaSender.stopP2P();
		}
	}

	public addPeerId(peerId: string): void {
		for (const mediaSender of Object.values(this.mediaSenders)) {
			mediaSender.addPeerId(peerId);
		}
	}

	public removePeerId(peerId: string): void {
		for (const mediaSender of Object.values(this.mediaSenders)) {
			mediaSender.removePeerId(peerId);
		}
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

						fileService.iceServers = iceServers;

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
					case 'turnCredentials': {
						const { iceServers } = notification.data;

						this.iceServers = iceServers;

						break;
					}

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
						const transport = await this.getPeerTransport(peerId, direction === 'send' ? 'recv' : 'send');

						await transport.connect({ dtlsParameters, iceParameters });

						break;
					}

					case 'candidate': {
						const { peerId, candidate, direction } = notification.data;
						const transport = await this.getPeerTransport(peerId, direction === 'send' ? 'recv' : 'send');

						await transport.addIceCandidate({ candidate });
						
						break;
					}

					case 'peerProduce': {
						const { peerId, id, kind, rtpParameters, appData } = notification.data;

						this.consumerCreationState.set(id, { paused: false, closed: false });

						const peerTransport = await this.getPeerTransport(peerId, 'recv');

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

						const {
							paused: consumerPaused,
							closed,
						} = this.consumerCreationState.get(id) || {
							paused: false,
							closed: false,
						};

						peerConsumer.appData.producerPaused = consumerPaused;

						if (closed) {
							this.consumerCreationState.delete(id);
							peerConsumer.close();

							return;
						}

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

						this.consumerCreationState.delete(id);

						break;
					}

					case 'peerCloseProducer':
					case 'peerPauseProducer':
					case 'peerResumeProducer': {
						const { producerId } = notification.data;

						const consumer = this.consumers.get(producerId);

						if (!consumer) {
							const consumerCreationState = this.consumerCreationState.get(producerId);

							if (consumerCreationState) {
								if (notification.method === 'peerCloseProducer') consumerCreationState.closed = true;
								if (notification.method === 'peerPauseProducer') consumerCreationState.paused = true;
								if (notification.method === 'peerResumeProducer') consumerCreationState.paused = false;

								return;
							}

							throw new Error('consumer not found');
						}

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
								producerPaused,
							},
						});

						const {
							paused: consumerPaused,
							closed,
						} = this.consumerCreationState.get(id) || {
							paused: producerPaused,
							closed: false,
						};

						consumer.appData.producerPaused = consumerPaused;

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

						if (paused) this.changeConsumer(consumer.id, 'resume', true);

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
								if (notification.method === 'consumerResumed') consumerCreationState.paused = false;

								return;
							}

							return;
						}
	
						this.changeConsumer(consumerId, changeEvent[notification.method] as MediaChange, false);

						break;
					}

					case 'dataConsumerClosed': {
						const { dataConsumerId } = notification.data;

						this.closeDataConsumer(dataConsumerId, false);

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
			canRecord: Boolean(MediaRecorder),
			canTranscribe: Boolean(window.webkitSpeechRecognition) && edumeetConfig.transcriptionEnabled,
		};
	}

	get rtpCapabilities(): RtpCapabilities | undefined {
		return this.mediasoup?.rtpCapabilities;
	}

	public changeConsumer(consumerId: string, change: MediaChange, local = true): void {
		logger.debug(`${change}Consumer [consumerId: %s, local: %s]`, consumerId, local);

		const consumer = this.consumers.get(consumerId);

		if (!consumer) return logger.warn('consumer not found');

		if (local) {
			if (consumer.appData.peerConsumer) {
				this.signalingService.notify(`${change}PeerConsumer`, { consumerId: consumer.id });
			} else {
				this.signalingService.notify(`${change}Consumer`, { consumerId: consumer.id });
			}
		} else if (!local) {
			this.emit(`consumer${changeEvent[change]}`, consumer);
		}

		if (change === 'close') {
			consumer?.[`${change}`]();
		} else if (local) {
			consumer?.[`${change}`]();
		} else {
			consumer.appData.producerPaused = change === 'pause';
		}
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

			const monitor = await this.monitor;

			if (monitor)
				monitor.collectors.addMediasoupDevice(this.mediasoup);
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

		const monitor = await this.monitor;

		if (monitor)
			monitor.collectors.addRTCPeerConnection(transport.handler.pc)

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

	public getPeerDevice(peerId: string): PeerDevice {
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

	public async getPeerTransport(peerId: string, direction: 'recv' | 'send'): Promise<PeerTransport> {
		const map = direction === 'recv' ? this.peerRecvTransports : this.peerSendTransports;

		let peerTransport = map.get(peerId);

		if (!peerTransport) {
			peerTransport = (async () => {
				const p2pDevice = this.getPeerDevice(peerId);

				await p2pDevice.ready;
				await this.mediaReady;

				let transport;

				if (direction === 'recv') {
					transport = p2pDevice.createRecvTransport({ iceServers: this.iceServers });
				} else {
					transport = p2pDevice.createSendTransport({ iceServers: this.iceServers });
				}

				const monitor = await this.monitor;

				if (monitor) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const handler = transport.handler as any;
					const pc = handler?.pc as RTCPeerConnection | undefined;

					if (pc)
						monitor.collectors.addRTCPeerConnection(pc);
				}

				transport.on('icecandidate', (candidate) => {
					this.signalingService.notify('candidate', {
						peerId,
						candidate,
						direction,
					});
				});

				transport.on('connect', ({ dtlsParameters, iceParameters }, callback, errback) => {
					this.signalingService.sendRequest('peerConnect', {
						peerId,
						dtlsParameters,
						iceParameters,
						direction
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

			map.set(peerId, peerTransport);
		}

		return peerTransport;
	}

	public async produceData(options: DataProducerOptions): Promise<DataProducer> {
		await this.transportsReady;

		if (!this.sendTransport) throw new Error('Send transport not ready');

		const dataProducer = await this.sendTransport.produceData(options);

		this.dataProducers.set(dataProducer.id, dataProducer);
		dataProducer.observer.once('close', () => this.dataProducers.delete(dataProducer.id));

		return dataProducer;
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
