import { Middleware } from '@reduxjs/toolkit';
import { Device } from 'mediasoup-client';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/Producer';
import { Transport } from 'mediasoup-client/lib/Transport';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { producersActions } from '../slices/producersSlice';
import { deviceActions } from '../slices/deviceSlice';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';

const logger = new Logger('MediaMiddleware');

const createMediaMiddleware = ({
	config,
	mediaService,
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

	const mediasoup: Device = new Device();
	let sendTransport: Transport;
	let recvTransport: Transport;
	const producers: Map<string, Producer> = new Map();
	const consumers: Map<string, Consumer> = new Map();

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => async (action) => {
			// Start listening for signaling events on connection established
			if (signalingActions.connected.match(action)) {
				signalingService.on('notification', async (notification) => {
					logger.debug(
						'signalingService "notification" event [method:%s, data:%o]',
						notification.method, notification.data);

					try {
						switch (notification.method) {
							case 'producerPaused': {
								const { producerId } = notification.data;

								dispatch(producersActions.setProducerPaused({ producerId }));
								break;
							}

							case 'producerResumed': {
								const { producerId } = notification.data;

								dispatch(producersActions.setProducerResumed({ producerId }));
								break;
							}

							case 'producerClosed': {
								const { producerId } = notification.data;

								dispatch(producersActions.closeProducer({ producerId }));
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
			
								const consumer = await recvTransport.consume({
									id,
									producerId,
									kind,
									rtpParameters,
									appData: {
										...appData,
										peerId,
									},
								});
			
								const stateConsumer: StateConsumer = {
									id: consumer.id,
									peerId,
									kind: consumer.kind,
									localPaused: true,
									remotePaused: producerPaused,
									source: consumer.appData.source,
								};

								consumers.set(consumer.id, consumer);
			
								consumer.once('transportclose', () => {
									consumers.delete(consumer.id);
									dispatch(consumersActions.removeConsumer({ consumerId: consumer.id }));
								});

								dispatch(consumersActions.addConsumer({ consumer: stateConsumer }));
								break;
							}

							case 'consumerClosed': {
								const { consumerId } = notification.data;

								logger.debug('consumerClosed [consumerId:%s]', consumerId);
								const consumer = consumers.get(consumerId);
			
								if (!consumer) {
									logger.warn('consumerClosed, no such consumer [consumerId:%s]', consumerId);
									
									return;
								}
			
								consumer.close();
								dispatch(consumersActions.removeConsumer({ consumerId }));
								break;
							}

							case 'consumerPaused': {
								const { consumerId } = notification.data;

								dispatch(consumersActions.setConsumerPaused({ consumerId }));
								break;
							}

							case 'consumerResumed': {
								const { consumerId } = notification.data;

								dispatch(consumersActions.setConsumerResumed({ consumerId }));
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (roomActions.updateRoom.match(action) && action.payload.joined) {
				try {
					const routerRtpCapabilities = await signalingService.sendRequest('getRouterRtpCapabilities');

					await mediasoup.load({ routerRtpCapabilities });

					{
						const {
							id,
							iceParameters,
							iceCandidates,
							dtlsParameters,
						} = await signalingService.sendRequest('createWebRtcTransport', {
							forceTcp: false,
							producing: true,
							consuming: false,
						});

						sendTransport = mediasoup.createSendTransport({
							id,
							iceParameters,
							iceCandidates,
							dtlsParameters,
						});

						// eslint-disable-next-line no-shadow
						sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
							signalingService.sendRequest('connectWebRtcTransport', {
								transportId: sendTransport.id,
								dtlsParameters,
							})
								.then(callback)
								.catch(errback);
						});

						sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
							try {
								// eslint-disable-next-line no-shadow
								const { id } = await signalingService.sendRequest('produce', {
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
					}

					{
						const {
							id,
							iceParameters,
							iceCandidates,
							dtlsParameters,
						} = await signalingService.sendRequest('createWebRtcTransport', {
							forceTcp: false,
							producing: false,
							consuming: true,
						});

						recvTransport = mediasoup.createRecvTransport({
							id,
							iceParameters,
							iceCandidates,
							dtlsParameters,
						});

						// eslint-disable-next-line no-shadow
						recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
							signalingService.sendRequest('connectWebRtcTransport', {
								transportId: recvTransport.id,
								dtlsParameters,
							})
								.then(callback)
								.catch(errback);
						});
					}

					// This will trigger "join" in roomMiddleware
					dispatch(
						webrtcActions.setRtpCapabilities({
							rtpCapabilities: mediasoup.rtpCapabilities
						})
					);
				} catch (error) {
					logger.error('error on starting mediasoup transports [error:%o]', error);
				}
			}

			if (consumersActions.setConsumerPaused.match(action)) {
				const { consumerId, local } = action.payload;

				logger.debug('pauseConsumer [consumerId:%s]', consumerId);
				const consumer = consumers.get(consumerId);

				if (!consumer) {
					logger.warn('pauseConsumer, no such consumer [consumerId:%s]', consumerId);
					
					return;
				}

				if (local) {
					await signalingService.sendRequest('pauseConsumer', { consumerId: consumer.id })
						.catch((error) => logger.warn('pauseConsumer, unable to pause server-side [consumerId:%s, error:%o]', consumerId, error));
				}

				consumer.pause();
			}
			
			if (consumersActions.setConsumerResumed.match(action)) {
				const { consumerId, local } = action.payload;

				logger.debug('resumeConsumer [consumerId:%s]', consumerId);
				const consumer = consumers.get(consumerId);

				if (!consumer) {
					logger.warn('resumeConsumer, no such consumer [consumerId:%s]', consumerId);
					
					return;
				}

				if (local) {
					await signalingService.sendRequest('resumeConsumer', { consumerId: consumer.id })
						.catch((error) => logger.warn('resumeConsumer, unable to resume server-side [consumerId:%s, error:%o]', consumerId, error));
				}

				consumer.resume();
			}

			if (producersActions.setProducerPaused.match(action)) {
				const { producerId, local } = action.payload;

				logger.debug('pauseProducer [producerId:%s]', producerId);
				const producer = producers.get(producerId);

				if (!producer) {
					logger.warn('pauseProducer, no such producer [producerId:%s]', producerId);
					
					return;
				}

				if (local) {
					await signalingService.sendRequest('pauseProducer', { producerId: producer.id })
						.catch((error) => logger.warn('pauseProducer, unable to pause server-side [producerId:%s, error:%o]', producerId, error));
				}

				producer.pause();
			}
			
			if (producersActions.setProducerResumed.match(action)) {
				const { producerId, local } = action.payload;

				logger.debug('resumeProducer [producerId:%s]', producerId);
				const producer = producers.get(producerId);

				if (!producer) {
					logger.warn('resumeProducer, no such producer [producerId:%s]', producerId);
					
					return;
				}

				if (local) {
					await signalingService.sendRequest('resumeProducer', { producerId: producer.id })
						.catch((error) => logger.warn('resumeProducer, unable to resume server-side [producerId:%s, error:%o]', producerId, error));
				}

				producer.resume();
			}

			if (producersActions.closeProducer.match(action)) {
				const { producerId, local } = action.payload;

				logger.debug('closeProducer [producerId:%s]', producerId);

				const producer = producers.get(producerId);

				if (!producer) {
					logger.warn('closeProducer, no such producer [producerId:%s]', producerId);

					return;
				}

				if (local) {
					await signalingService.sendRequest('closeProducer', { producerId: producer.id })
						.catch((error) => logger.warn('closeProducer, unable to close server-side [producerId:%s, error:%o]', producerId, error));
				}

				producer.close();
			}

			if (deviceActions.updateWebcam.match(action)) {
				const {
					init = false,
					start = false,
					restart = false,
					newDeviceId,
					newResolution,
					newFrameRate
				} = action.payload;

				logger.debug(
					'updateWebcam() [init:%s, start:%s, restart:%s, newDeviceId:%s, newResolution:%s, newFrameRate:%s]',
					init,
					start,
					restart,
					newDeviceId,
					newResolution,
					newFrameRate
				);

				let track;

				try {
					if (!mediasoup.canProduce('video'))
						throw new Error('cannot produce video');

					if (newDeviceId && !restart)
						throw new Error('changing device requires restart');
	
					if (newDeviceId) {
						dispatch(
							settingsActions.setSelectedVideoDevice({
								deviceId: newDeviceId
							})
						);
					}
			
					if (newResolution) {
						dispatch(
							settingsActions.setResolution({ resolution: newResolution }));
					}
			
					if (newFrameRate) {
						dispatch(
							settingsActions.setFrameRate({ frameRate: newFrameRate }));
					}

					/*
						const { videoMuted } = store.getState().settings;

						if (init && videoMuted)
							return;
						else
							store.dispatch(settingsActions.setVideoMuted(false));

						store.dispatch(meActions.setWebcamInProgress(true));
					*/

					const {
						aspectRatio,
						resolution,
						frameRate,
						selectedVideoDevice
					} = getState().settings;

					const deviceId = await mediaService.getDeviceId(selectedVideoDevice, 'videoinput');

					if (!deviceId)
						throw new Error('no webcam devices');

					const webcamProducer =
						Array.from(producers.values())
							.find((producer) => producer.appData.source === 'webcam');

					if ((restart && webcamProducer) || start) {
						if (webcamProducer) {
							dispatch(producersActions.closeProducer({
								producerId: webcamProducer.id,
								local: true
							}));
						}
			
						const stream = await navigator.mediaDevices.getUserMedia({
							video: {
								deviceId: { ideal: deviceId },
								...mediaService.getVideoConstrains(resolution, aspectRatio),
								frameRate
							}
						});
			
						([ track ] = stream.getVideoTracks());

						const { deviceId: trackDeviceId, width, height } = track.getSettings();

						dispatch(
							settingsActions.setSelectedVideoDevice({
								deviceId: trackDeviceId
							})
						);

						let newWebcamProducer: Producer;

						if (config.simulcast) {
							const encodings = mediaService.getEncodings(
								mediasoup.rtpCapabilities,
								width,
								height
							);
							const resolutionScalings =
								encodings.map((encoding) => encoding.scaleResolutionDownBy);

							newWebcamProducer = await sendTransport.produce({
								track,
								encodings,
								codecOptions: {
									videoGoogleStartBitrate: 1000
								},
								appData: {
									source: 'webcam',
									width,
									height,
									resolutionScalings
								}
							});
						} else {
							newWebcamProducer = await sendTransport.produce({
								track,
								appData: {
									source: 'webcam',
									width,
									height
								}
							});
						}

						producers.set(newWebcamProducer.id, newWebcamProducer);

						dispatch(producersActions.addProducer({
							id: newWebcamProducer.id,
							kind: newWebcamProducer.kind,
							source: newWebcamProducer.appData.source,
							paused: newWebcamProducer.paused,
							trackId: newWebcamProducer.track?.id,
						}));

						newWebcamProducer.once('close', () => {
							producers.delete(newWebcamProducer.id);
						});

						newWebcamProducer.once('transportclose', () => {
							dispatch(
								producersActions.closeProducer({
									producerId: newWebcamProducer.id,
									local: true
								})
							);
						});

						newWebcamProducer.once('trackended', () => {
							dispatch(
								producersActions.closeProducer({
									producerId: newWebcamProducer.id,
									local: true
								})
							);
						});
					} else if (webcamProducer) {
						({ track } = webcamProducer);

						await track?.applyConstraints({
							...mediaService.getVideoConstrains(resolution, aspectRatio),
							frameRate
						});

						const extraVideoProducers =
							Array.from(producers.values())
								.filter((producer) => producer.appData.source === 'extravideo');

						// Also change resolution of extra video producers
						for (const producer of extraVideoProducers) {
							({ track } = producer);

							await track?.applyConstraints({
								...mediaService.getVideoConstrains(resolution, aspectRatio),
								frameRate
							});
						}
					}

					await mediaService.updateMediaDevices();
				} catch (error) {
					logger.error('updateWebcam() [error:"%o"]', error);
		
					if (track)
						track.stop();
				} finally {
					dispatch(meActions.setWebcamInProgress({ webcamInProgress: false }));
				}
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediaMiddleware;