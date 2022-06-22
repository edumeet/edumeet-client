import { Middleware } from '@reduxjs/toolkit';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { Logger } from '../../utils/logger';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomActions } from '../slices/roomSlice';
import { producersActions, ProducerSource } from '../slices/producersSlice';
import { videoConsumersSelector } from '../selectors';
import { peersActions } from '../slices/peersSlice';

const logger = new Logger('MediaMiddleware');

const createMediaMiddleware = ({
	mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: RootState
	}) =>
		(next) => async (action) => {
			if (roomActions.setState.match(action) && action.payload === 'joined') {
				// Server has provided us with a new Consumer. The MediaService
				// has created it for us and we need to add it to the store.
				// MediaService will notify us of any changes to Consumer.
				mediaService.on('consumerCreated', (consumer, producerPaused) => {
					const stateConsumer: StateConsumer = {
						id: consumer.id,
						peerId: consumer.appData.peerId as string,
						kind: consumer.kind,
						localPaused: false,
						remotePaused: producerPaused,
						source: consumer.appData.source as ProducerSource,
					};

					dispatch(consumersActions.addConsumer(stateConsumer));
				});

				// Server has changed the state of a Consumer/Producer, update the store.
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
			}

			// These actions are dispatched from the UI somewhere manually (button clicks, etc)
			// We need to make the mediaService aware of the actions.
			if (consumersActions.setConsumerPaused.match(action) && action.payload.local)
				await mediaService.changeConsumer(action.payload.consumerId, 'pause');

			if (consumersActions.setConsumerResumed.match(action) && action.payload.local)
				await mediaService.changeConsumer(action.payload.consumerId, 'resume');

			if (producersActions.setProducerPaused.match(action) && action.payload.local)
				await mediaService.changeProducer(action.payload.producerId, 'pause');

			if (producersActions.setProducerResumed.match(action) && action.payload.local)
				await mediaService.changeProducer(action.payload.producerId, 'resume');

			if (producersActions.closeProducer.match(action) && action.payload.local)
				await mediaService.changeProducer(action.payload.producerId, 'close');

			if ( // These events will possibly change which Consumer is being displayed
				consumersActions.addConsumer.match(action) ||
				consumersActions.removeConsumer.match(action) ||
				peersActions.addPeers.match(action) ||
				peersActions.addPeer.match(action) ||
				peersActions.removePeer.match(action) ||
				roomActions.setActiveSpeakerId.match(action) ||
				roomActions.addSpotlightList.match(action) ||
				roomActions.spotlightPeer.match(action) ||
				roomActions.deSpotlightPeer.match(action) ||
				roomActions.selectPeer.match(action) ||
				roomActions.deselectPeer.match(action) ||
				roomActions.setFullscreenConsumer.match(action) ||
				roomActions.setWindowedConsumer.match(action)
			) {
				// Make a diff of the current state and the new state to find out
				// which Consumers need to be paused/resumed.
				const oldConsumersList = videoConsumersSelector(getState());

				next(action);

				const newConsumersList = videoConsumersSelector(getState());

				const pausedConsumersList = oldConsumersList.filter(
					(consumer) => !newConsumersList.includes(consumer)
				);
				const resumedConsumersList = newConsumersList.filter(
					(consumer) => !oldConsumersList.includes(consumer)
				);

				// Need to do some extra work to determine if the Consumer is
				// gone or not. If it is gone, we will not be able to pause/resume it.
				let removedConsumerId: string | null = null;
				let removedPeerId: string | null = null;

				if (consumersActions.removeConsumer.match(action))
					({ consumerId: removedConsumerId } = action.payload);

				if (peersActions.removePeer.match(action))
					({ id: removedPeerId } = action.payload);

				await Promise.all([
					pausedConsumersList.map(async ({ id: consumerId, peerId }) => {
						if (peerId !== removedPeerId && consumerId !== removedConsumerId) {
							await mediaService.changeConsumer(consumerId, 'pause');
							dispatch(consumersActions.setConsumerPaused({ consumerId }));
						}
					}),
					resumedConsumersList.map(async ({ id: consumerId, peerId }) => {
						if (peerId !== removedPeerId && consumerId !== removedConsumerId) {
							await mediaService.changeConsumer(consumerId, 'resume');
							dispatch(consumersActions.setConsumerResumed({ consumerId }));
						}
					})
				]);

				return;
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediaMiddleware;