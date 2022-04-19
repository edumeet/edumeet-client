import EventEmitter from 'events';
import { Device } from 'mediasoup-client';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer, ProducerOptions } from 'mediasoup-client/lib/Producer';
import { Transport } from 'mediasoup-client/lib/Transport';
import {
	RtpCapabilities,
	RtpEncodingParameters,
} from 'mediasoup-client/lib/RtpParameters';
import edumeetConfig from '../utils/edumeetConfig';
import { Logger } from '../utils/logger';
import { Resolution, SimulcastProfile } from '../utils/types';
import { SignalingService } from './signalingService';

const logger = new Logger('MediaService');

const VIDEO_CONSTRAINS: Record<Resolution, Record<string, number>> = {
	'low': { width: 320 },
	'medium': { width: 640 },
	'high': { width: 1280 },
	'veryhigh': { width: 1920 },
	'ultra': { width: 3840 }
};

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3_KEY' } ];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS: RtpEncodingParameters[] =
	[ { scalabilityMode: 'S3T3', dtx: true } ];

export interface MediaDevice {
	deviceId: string;
	kind: MediaDeviceKind;
	label: string;
}

export interface DevicesUpdated {
	devices: MediaDeviceInfo[];
	removedDevices: MediaDeviceInfo[];
	newDevices: MediaDeviceInfo[];
}

interface MediaCapabilities {
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
}

export declare interface MediaService {
	// eslint-disable-next-line no-unused-vars
	on(event: 'devicesUpdated', listener: (updatedDevices: DevicesUpdated) => void): this;
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
	private devices: MediaDevice[] = [];

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

	public getConsumers(): Consumer[] {
		return [ ...this.consumers.values() ];
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

	public getEncodings(
		width: number | undefined,
		height: number | undefined,
		screenSharing?: boolean
	): RtpEncodingParameters[] {
		if (!width || !height) {
			throw new Error('missing width or height');
		}

		const firstVideoCodec =
			this.mediasoup.rtpCapabilities.codecs?.find((c) => c.kind === 'video');

		if (!firstVideoCodec) {
			throw new Error('No video codecs');
		}

		let encodings: RtpEncodingParameters[];
		const size = (width > height ? width : height);

		if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9') {
			encodings = screenSharing ? VIDEO_SVC_ENCODINGS : VIDEO_KSVC_ENCODINGS;
		} else {
			encodings = this.chooseEncodings(edumeetConfig.simulcastProfiles, size);
		}

		return encodings;
	}

	private chooseEncodings(
		simulcastProfiles: Record<string, SimulcastProfile[]>,
		size: number,
	): RtpEncodingParameters[] {
		let encodings: RtpEncodingParameters[] = [];

		const sortedMap = new Map([ ...Object.entries(simulcastProfiles) ]
			.sort((a, b) => parseInt(b[0]) - parseInt(a[0])));

		for (const [ key, value ] of sortedMap) {
			if (parseInt(key) < size) {
				if (encodings === null) {
					encodings = value;
				}

				break;
			}

			encodings = value;
		}

		// hack as there is a bug in mediasoup
		if (encodings.length === 1) {
			encodings.push({ ...encodings[0] });
		}

		return encodings;
	}
	
	public getVideoConstrains(
		resolution: Resolution,
		aspectRatio: number
	): Record<'width' | 'height', Record<'ideal', number>> {
		return {
			width: { ideal: VIDEO_CONSTRAINS[resolution].width },
			height: { ideal: VIDEO_CONSTRAINS[resolution].width / aspectRatio }
		};
	}

	public async updateMediaDevices(): Promise<void> {
		logger.debug('updateMediaDevices()');

		let removedDevices: MediaDevice[];
		let newDevices: MediaDevice[];

		try {
			const devicesList =
				(await navigator.mediaDevices.enumerateDevices())
					.filter((d) => d.deviceId)
					.map((d) => ({ deviceId: d.deviceId, kind: d.kind, label: d.label }));

			if (devicesList.length === 0)
				return;

			removedDevices =
				this.devices.filter(
					(device) => !devicesList.find((d) => d.deviceId === device.deviceId)
				);
			
			newDevices =
				devicesList.filter(
					(device) => !this.devices.find((d) => d.deviceId === device.deviceId)
				);

			this.devices = devicesList;

			this.emit('devicesUpdated', {
				devices: this.devices,
				removedDevices,
				newDevices
			});
		} catch (error) {
			logger.error('updateMediaDevices() [error:%o]', error);
		}
	}

	public getDeviceId(deviceId: string, kind: MediaDeviceKind): string | undefined {
		let device = this.devices.find((d) => d.deviceId === deviceId);

		if (!device) {
			device = this.devices.find((d) => d.kind === kind);
		}

		return device?.deviceId;
	}

	private handleSignaling(): void {
		this.signalingService.on('notification', async (notification) => {
			logger.debug(
				'signalingService "notification" event [method:%s, data:%o]',
				notification.method, notification.data);

			try {
				switch (notification.method) {
					case 'producerPaused': {
						const { producerId } = notification.data;

						await this.pauseProducer(producerId, false);
						break;
					}

					case 'producerResumed': {
						const { producerId } = notification.data;

						await this.resumeProducer(producerId, false);
						break;
					}

					case 'producerClosed': {
						const { producerId } = notification.data;

						await this.closeProducer(producerId, false);
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
							this.closeConsumer(consumer.id, false);
						});
	
						this.emit('consumerCreated', consumer, producerPaused);

						break;
					}

					case 'consumerPaused': {
						const { consumerId } = notification.data;
						
						await this.pauseConsumer(consumerId, false);
						break;
					}
					
					case 'consumerResumed': {
						const { consumerId } = notification.data;
						
						await this.resumeConsumer(consumerId, false);
						break;
					}

					case 'consumerClosed': {
						const { consumerId } = notification.data;
	
						await this.closeConsumer(consumerId, false);
						break;
					}
				}
			} catch (error) {
				logger.error('error on signalService "notification" event [error:%o]', error);
			}
		});
	}

	public getMediaCapabilities(): MediaCapabilities {
		return {
			canSendMic: this.mediasoup.canProduce('audio'),
			canSendWebcam: this.mediasoup.canProduce('video'),
			canShareScreen: Boolean(navigator.mediaDevices.getDisplayMedia) &&
				this.mediasoup.canProduce('video')
		};
	}

	public getRtpCapabilities(): RtpCapabilities {
		return this.mediasoup.rtpCapabilities;
	}

	public async closeConsumer(consumerId: string, local = true): Promise<void> {
		logger.debug('removeConsumer [consumerId:%s]', consumerId);
		const consumer = this.consumers.get(consumerId);

		if (local && consumer) {
			await this.signalingService.sendRequest('closeConsumer', { consumerId: consumer.id })
				.catch((error) => logger.warn('closeConsumer, unable to close server-side [consumerId:%s, error:%o]', consumerId, error));
		}

		if (!local) {
			this.emit('consumerClosed', consumer);
		}

		consumer?.close();
	}

	public async pauseConsumer(consumerId: string, local = true): Promise<void> {
		logger.debug('pauseConsumer [consumerId:%s]', consumerId);
		const consumer = this.consumers.get(consumerId);

		if (local && consumer) {
			await this.signalingService.sendRequest('pauseConsumer', { consumerId: consumer.id })
				.catch((error) => logger.warn('pauseConsumer, unable to pause server-side [consumerId:%s, error:%o]', consumerId, error));
		}

		if (!local) {
			this.emit('consumerPaused', consumer);
		}

		consumer?.pause();
	}

	public async resumeConsumer(consumerId: string, local = true): Promise<void> {
		logger.debug('resumeConsumer [consumerId:%s]', consumerId);
		const consumer = this.consumers.get(consumerId);

		if (local && consumer) {
			await this.signalingService.sendRequest('resumeConsumer', { consumerId: consumer.id })
				.catch((error) => logger.warn('resumeConsumer, unable to resume server-side [consumerId:%s, error:%o]', consumerId, error));
		}

		if (!local) {
			this.emit('consumerResumed', consumer);
		}

		consumer?.resume();
	}

	public async closeProducer(producerId: string, local = true): Promise<void> {
		logger.debug('closeProducer [producerId:%s]', producerId);
		const producer = this.producers.get(producerId);

		if (local && producer) {
			await this.signalingService.sendRequest('closeProducer', { producerId: producer.id })
				.catch((error) => logger.warn('closeProducer, unable to close server-side [producerId:%s, error:%o]', producerId, error));
		}

		if (!local) {
			this.emit('producerClosed', producer);
		}

		producer?.close();
	}

	public async pauseProducer(producerId: string, local = true): Promise<void> {
		logger.debug('pauseProducer [producerId:%s]', producerId);
		const producer = this.producers.get(producerId);

		if (local && producer) {
			await this.signalingService.sendRequest('pauseProducer', { producerId: producer.id })
				.catch((error) => logger.warn('pauseProducer, unable to pause server-side [producerId:%s, error:%o]', producerId, error));
		}

		if (!local) {
			this.emit('producerPaused', producer);
		}

		producer?.pause();
	}

	public async resumeProducer(producerId: string, local = true): Promise<void> {
		logger.debug('resumeProducer [producerId:%s]', producerId);
		const producer = this.producers.get(producerId);

		if (local && producer) {
			await this.signalingService.sendRequest('resumeProducer', { producerId: producer.id })
				.catch((error) => logger.warn('resumeProducer, unable to resume server-side [producerId:%s, error:%o]', producerId, error));
		}

		if (!local) {
			this.emit('producerResumed', producer);
		}

		producer?.resume();
	}

	public async createTransports(iceServers?: RTCIceServer[]): Promise<void> {
		try {
			const routerRtpCapabilities = await this.signalingService.sendRequest('getRouterRtpCapabilities');

			await this.mediasoup.load({ routerRtpCapabilities });

			{
				const {
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
				} = await this.signalingService.sendRequest('createWebRtcTransport', {
					forceTcp: false,
					producing: true,
					consuming: false,
				});

				const sendTransport = this.mediasoup.createSendTransport({
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
					iceServers
				});

				// eslint-disable-next-line no-shadow
				sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
					this.signalingService.sendRequest('connectWebRtcTransport', {
						transportId: sendTransport.id,
						dtlsParameters,
					})
						.then(callback)
						.catch(errback);
				});

				sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
					try {
						// eslint-disable-next-line no-shadow
						const { id } = await this.signalingService.sendRequest('produce', {
							transportId: sendTransport.id,
							kind,
							rtpParameters,
							appData,
						});

						callback({ id });
					} catch (error) {
						errback(error);
					}
				});

				this.sendTransport = sendTransport;
			}

			{
				const {
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
				} = await this.signalingService.sendRequest('createWebRtcTransport', {
					forceTcp: false,
					producing: false,
					consuming: true,
				});

				const recvTransport = this.mediasoup.createRecvTransport({
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
					iceServers
				});

				// eslint-disable-next-line no-shadow
				recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
					this.signalingService.sendRequest('connectWebRtcTransport', {
						transportId: recvTransport.id,
						dtlsParameters,
					})
						.then(callback)
						.catch(errback);
				});

				this.recvTransport = recvTransport;
			}
		} catch (error) {
			logger.error('error on starting mediasoup transports [error:%o]', error);
		}
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
			this.closeProducer(producer.id, false);
		});

		producer.once('trackended', () => {
			this.closeProducer(producer.id, false);
		});

		return producer;
	}
}