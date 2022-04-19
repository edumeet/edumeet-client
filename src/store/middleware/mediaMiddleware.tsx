import { Middleware } from '@reduxjs/toolkit';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { Logger } from '../../utils/logger';
import { MiddlewareOptions } from '../store';
import { roomActions } from '../slices/roomSlice';
import { webrtcActions } from '../slices/webrtcSlice';
import { producersActions } from '../slices/producersSlice';
import { meActions } from '../slices/meSlice';

const logger = new Logger('MediaMiddleware');

const createMediaMiddleware = ({
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

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

				await mediaService.createTransports(iceServers);

				dispatch(meActions.setMediaCapabilities(
					mediaService.getMediaCapabilities()
				));

				// This will trigger "join" in roomMiddleware
				dispatch(webrtcActions.setRtpCapabilities(
					mediaService.getRtpCapabilities()
				));
			}

			if (consumersActions.setConsumerPaused.match(action) && action.payload.local) {
				const { consumerId } = action.payload;

				await mediaService.pauseConsumer(consumerId);
			}
			
			if (consumersActions.setConsumerResumed.match(action) && action.payload.local) {
				const { consumerId } = action.payload;

				await mediaService.resumeConsumer(consumerId);
			}

			if (producersActions.setProducerPaused.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.pauseProducer(producerId);
			}
			
			if (producersActions.setProducerResumed.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.resumeProducer(producerId);
			}

			if (producersActions.closeProducer.match(action) && action.payload.local) {
				const { producerId } = action.payload;

				await mediaService.closeProducer(producerId);
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediaMiddleware;