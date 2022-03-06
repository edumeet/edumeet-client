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

const logger = new Logger('MediasoupMiddleware');

const createMediasoupMiddleware = ({ signalingService }: MiddlewareOptions) => {
	logger.debug('createMediasoupMiddleware()');

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
			
								const consumer = await recvTransport?.consume({
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
									track: consumer.track,
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

								logger.debug('consumerPaused [consumerId:%s]', consumerId);
								const consumer = consumers.get(consumerId);
			
								if (!consumer) {
									logger.warn('consumerPaused, no such consumer [consumerId:%s]', consumerId);
									
									return;
								}
			
								consumer.pause();
								dispatch(consumersActions.setConsumerPaused({ consumerId }));

								break;
							}

							case 'consumerResumed': {
								const { consumerId } = notification.data;

								logger.debug('consumerResumed [consumerId:%s]', consumerId);
								const consumer = consumers.get(consumerId);

								if (!consumer) {
									logger.warn('consumerPaused, no such consumer [consumerId:%s]', consumerId);
									
									return;
								}

								consumer.resume();
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

					dispatch(
						webrtcActions.setRtpCapabilities({
							rtpCapabilities: mediasoup.rtpCapabilities
						})
					);

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
				} catch (error) {
					logger.error('error on starting mediasoup transports [error:%o]', error);
				}
			}

			// These consumers were paused/resumed locally, we need to notify server
			if (consumersActions.setConsumerPaused.match(action) && action.payload.local) {
				const { consumerId } = action.payload;

				logger.debug('pauseConsumer [consumerId:%s]', consumerId);
				const consumer = consumers.get(consumerId);

				if (!consumer) {
					logger.warn('pauseConsumer, no such consumer [consumerId:%s]', consumerId);
					
					return;
				}

				await signalingService.sendRequest('pauseConsumer', { consumerId: consumer.id })
					.catch((error) => logger.warn('pauseConsumer, unable to pause server-side [consumerId:%s, error:%o]', consumerId, error));

				consumer.pause();
			} else if (
				consumersActions.setConsumerResumed.match(action) && action.payload.local
			) {
				const { consumerId } = action.payload;

				logger.debug('resumeConsumer [consumerId:%s]', consumerId);
				const consumer = consumers.get(consumerId);

				if (!consumer) {
					logger.warn('resumeConsumer, no such consumer [consumerId:%s]', consumerId);
					
					return;
				}

				await signalingService.sendRequest('resumeConsumer', { consumerId: consumer.id })
					.catch((error) => logger.warn('resumeConsumer, unable to resume server-side [consumerId:%s, error:%o]', consumerId, error));

				consumer.resume();
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediasoupMiddleware;