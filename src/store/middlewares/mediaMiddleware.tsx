import { Middleware } from '@reduxjs/toolkit';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomActions } from '../slices/roomSlice';
import { producersActions, ProducerSource } from '../slices/producersSlice';
import { videoConsumersSelector } from '../selectors';
import { peersActions } from '../slices/peersSlice';
import { Logger } from 'edumeet-common';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { mediaActions } from '../slices/mediaSlice';
import { mediaNodeConnectionError, mediaNodeConnectionSuccess, mediaNodeSvcUnavailable } from '../../components/translated/translatedComponents';
import { meActions } from '../slices/meSlice';
import { startMedia } from '../actions/mediaActions';

const logger = new Logger('MediaMiddleware');

/**
 * This middleware represents the connection between the
 * MediaService, the Redux store and the React components.
 * 
 * It listens to the MediaService events and dispatches
 * the corresponding Redux actions.
 * 
 * It also listens to the Redux actions and calls the
 * MediaService methods.
 * 
 * This way the MediaService and the Redux store are
 * kept in sync.
 * 
 * @param options - Middleware options. 
 * @returns {Middleware} Redux middleware.
 */
const createMediaMiddleware = ({
	mediaService, signalingService 
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

	const transcriptTimeouts = new Map<string, NodeJS.Timeout>();

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => async (action) => {
			if (roomActions.setState.match(action) && action.payload === 'left') {
				mediaService.close();
				mediaService.removeAllListeners();
			}

			if (roomActions.setState.match(action) && action.payload === 'joined') {
				/**
				 * At this point we have joined the room.
				 * We have our peers and can do everything non-media related.
				 * We add listeners to learn about media connection.
				 */
				signalingService.on('notification', (notification) => {
					if (notification.method === 'mediaReady') {
						const { mediaConnectionStatus, startMediaServiceInProgress } = getState().me;

						if (mediaConnectionStatus !== 'connected') {
							if (mediaConnectionStatus === 'error')
								dispatch(notificationsActions.enqueueNotification({
									message: mediaNodeConnectionSuccess(),
									options: { variant: 'success' }
								}));
							
							dispatch(meActions.setMediaConnectionStatus('connected'));
							!startMediaServiceInProgress && dispatch(startMedia());
						}
					}
					
					if (notification.method === 'noMediaAvailable') {
						const { mediaConnectionStatus } = getState().me;

						if (mediaConnectionStatus !== 'error')
							dispatch(notificationsActions.enqueueNotification({
								message: mediaNodeSvcUnavailable(),
								options: { variant: 'error' }
							}));
						dispatch(meActions.setMediaConnectionStatus('error'));
						dispatch(mediaActions.resetLiveMic());
						dispatch(mediaActions.resetLiveWebcam());
					}

					if (notification.method === 'mediaConnectionError') {
						dispatch(notificationsActions.enqueueNotification({
							message: mediaNodeConnectionError(),
							options: { variant: 'error' }
						}));
					}
				});
			}
			
			if (meActions.setMediaConnectionStatus.match(action) && action.payload === 'not_connected') {
				mediaService.close();
				mediaService.removeAllListeners();
			}
			
			if (meActions.setMediaConnectionStatus.match(action) && action.payload === 'error') {
				mediaService.close();
				mediaService.removeAllListeners();
			}

			if (meActions.setMediaConnectionStatus.match(action) && action.payload === 'connected') {
				/**
				 * At this point our peer has been assigned a router.
				 * We can start doing things related to media.
				 */
				mediaService.on('consumerCreated', (consumer, paused, producerPaused) => {
					const stateConsumer: StateConsumer = {
						id: consumer.id,
						peerId: consumer.appData.peerId as string,
						kind: consumer.kind,
						localPaused: false,
						remotePaused: paused,
						producerPaused,
						source: consumer.appData.source as ProducerSource,
					};

					dispatch(consumersActions.addConsumer(stateConsumer));
				});

				mediaService.on('transcriptionStarted', () => {
					dispatch(roomActions.updateRoom({ transcriptionRunning: true }));
				});

				mediaService.on('transcriptionStopped', () => {
					dispatch(roomActions.updateRoom({ transcriptionRunning: false }));
				});

				mediaService.on('transcript', ({ id, peerId, transcript, done }) => {
					const timeout = transcriptTimeouts.get(id);

					transcriptTimeouts.delete(id);
					clearTimeout(timeout);

					dispatch(peersActions.updateTranscript({ id, peerId, transcript, done }));

					const newTimeout = setTimeout(() => {
						dispatch(peersActions.removeTranscript({ id, peerId }));

						transcriptTimeouts.delete(id);
					}, done ? 5000 : 15000);

					transcriptTimeouts.set(id, newTimeout);

					dispatch(peersActions.updateTranscript({ id, peerId, transcript, done }));
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

					producer.kind === 'video' && dispatch(mediaActions.setVideoMuted(true));
					producer.kind === 'audio' && dispatch(mediaActions.setAudioMuted(true));
				});

				mediaService.on('producerPaused', (producer) => {
					dispatch(producersActions.setProducerPaused({
						producerId: producer.id
					}));
					
					producer.kind === 'video' && dispatch(mediaActions.setVideoMuted(true));
					producer.kind === 'audio' && dispatch(mediaActions.setAudioMuted(true));
				});

				mediaService.on('producerResumed', (producer) => {
					dispatch(producersActions.setProducerResumed({
						producerId: producer.id
					}));

					mediaService.on('consumerScore', (consumerId, score) => {
						dispatch(consumersActions.setScore({ consumerId, score }));	
					});
				
					mediaService.on('producerScore', (producerId, score) => {
						dispatch(producersActions.setScore({ producerId, score }));	
					});
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
				roomSessionsActions.setActiveSpeakerId.match(action) ||
				roomSessionsActions.spotlightPeer.match(action) ||
				roomSessionsActions.deSpotlightPeer.match(action) ||
				roomSessionsActions.selectPeer.match(action) ||
				roomSessionsActions.deselectPeer.match(action) ||
				roomSessionsActions.setFullscreenConsumer.match(action) ||
				roomSessionsActions.addWindowedConsumer.match(action) ||
				roomSessionsActions.removeWindowedConsumer.match(action)
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