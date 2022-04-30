import { Middleware } from '@reduxjs/toolkit';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { producersActions } from '../slices/producersSlice';
import { meActions } from '../slices/meSlice';
import { PerformanceMonitor } from '../../utils/performanceMonitor';
import { videoConsumersSelector } from '../selectors';
import { peersActions } from '../slices/peersSlice';

const logger = new Logger('MediaMiddleware');

const createMediaMiddleware = ({
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

	const performanceMonitor = new PerformanceMonitor();

	const middleware: Middleware = ({ dispatch, getState }) =>
		(next) => async (action) => {
			// This event is triggered when the server sends "roomReady" to us.
			// This means that we start our joining process which is:
			// 1. Listen for any media events from the MediaService
			// 2. Create our Mediasoup transports
			// 3. Discover our capabilities
			// 4. Pass the torch to RoomMiddleware to continue the join process
			if (roomActions.updateRoom.match(action) && action.payload.joined) {
				// Server has provided us with a new Consumer. The MediaService
				// has created it for us and we need to add it to the store.
				// MediaService will notify us of any changes to Consumer.
				mediaService.on('consumerCreated', (consumer, producerPaused) => {
					const stateConsumer: StateConsumer = {
						id: consumer.id,
						peerId: consumer.appData.peerId,
						kind: consumer.kind,
						localPaused: false,
						remotePaused: producerPaused,
						source: consumer.appData.source,
					};

					dispatch(consumersActions.addConsumer(stateConsumer));
				});

				mediaService.on('consumerClosed', (consumer) => {
					dispatch(consumersActions.removeConsumer({
						consumerId: consumer.id
					}));
				});

				mediaService.on('consumerPaused', (consumer) => {
					dispatch(consumersActions.setConsumerPaused({
						consumerId: consumer.id
					}));
				});

				mediaService.on('consumerResumed', (consumer) => {
					dispatch(consumersActions.setConsumerResumed({
						consumerId: consumer.id
					}));
				});

				mediaService.on('producerClosed', (producer) => {
					dispatch(producersActions.closeProducer({
						producerId: producer.id
					}));
				});

				mediaService.on('producerPaused', (producer) => {
					dispatch(producersActions.setProducerPaused({
						producerId: producer.id
					}));
				});

				mediaService.on('producerResumed', (producer) => {
					dispatch(producersActions.setProducerResumed({
						producerId: producer.id
					}));
				});

				const iceServers = getState().webrtc.iceServers;

				performanceMonitor.on('performance', (performance) => {
					logger.debug('"performance" event [trend:%s, performance:%s]', performance.trend, performance.performance);
				});

				const {
					recvTransport,
				} = await mediaService.createTransports(iceServers);

				if (recvTransport)
					performanceMonitor.monitorTransport(recvTransport);

				dispatch(meActions.setMediaCapabilities(
					mediaService.mediaCapabilities
				));

				// This will trigger "join" in roomMiddleware
				dispatch(webrtcActions.setRtpCapabilities(
					mediaService.rtpCapabilities
				));
			}

			if (consumersActions.setConsumerPaused.match(action) && action.payload.local) {
				const { consumerId } = action.payload;

				await mediaService.changeConsumer(consumerId, 'pause');
			}

			if (consumersActions.setConsumerResumed.match(action) && action.payload.local) {
				const { consumerId } = action.payload;

				await mediaService.changeConsumer(consumerId, 'resume');
			}

			if (producersActions.setProducerPaused.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.changeProducer(producerId, 'pause');
			}

			if (producersActions.setProducerResumed.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.changeProducer(producerId, 'resume');
			}

			if (producersActions.closeProducer.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.changeProducer(producerId, 'close');
			}

			if ( // These events will possibly change which Consumer is being displayed
				(consumersActions.addConsumer.match(action) && action.payload.kind === 'video') ||
				consumersActions.removeConsumer.match(action) ||
				peersActions.addPeer.match(action) || // TODO: fix pause when consumer is gone
				peersActions.removePeer.match(action) ||
				roomActions.setActiveSpeakerId.match(action) ||
				roomActions.spotlightPeer.match(action) ||
				roomActions.deSpotlightPeer.match(action) ||
				roomActions.selectPeer.match(action) ||
				roomActions.deselectPeer.match(action)
			) {
				const oldConsumersList = videoConsumersSelector(getState());

				next(action);

				const newConsumersList = videoConsumersSelector(getState());

				const pausedConsumersList = oldConsumersList.filter(
					(consumer) => !newConsumersList.includes(consumer)
				);
				const resumedConsumersList = newConsumersList.filter(
					(consumer) => !oldConsumersList.includes(consumer)
				);

				for (const consumer of pausedConsumersList) {
					await mediaService.changeConsumer(consumer.id, 'pause');
					dispatch(consumersActions.setConsumerPaused({
						consumerId: consumer.id,
						local: true
					}));
				}

				for (const consumer of resumedConsumersList) {
					await mediaService.changeConsumer(consumer.id, 'resume');
					dispatch(consumersActions.setConsumerResumed({
						consumerId: consumer.id,
						local: true
					}));
				}

				return;
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediaMiddleware;