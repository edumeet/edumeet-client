import { Middleware } from '@reduxjs/toolkit';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomActions } from '../slices/roomSlice';
import { resumedVideoConsumersSelector } from '../selectors';
import { peersActions } from '../slices/peersSlice';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from 'edumeet-common';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { meActions } from '../slices/meSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { batch } from 'react-redux';
import { updateMic, updateWebcam } from '../actions/mediaActions';
import { ProducerSource } from '../../utils/types';

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
	mediaService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createMediaMiddleware()');

	const transcriptTimeouts = new Map<string, number>();

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				mediaService.init();
			}

			if (roomActions.setState.match(action) && action.payload === 'joined') {
				// Server has provided us with a new Consumer. The MediaService
				// has created it for us and we need to add it to the store.
				// MediaService will notify us of any changes to Consumer.
				mediaService.on('consumerCreated', (consumer, paused, producerPaused, peerConsumer) => {
					const stateConsumer: StateConsumer = {
						id: consumer.id,
						peerId: consumer.appData.peerId as string,
						peerConsumer,
						kind: consumer.kind,
						localPaused: paused,
						remotePaused: producerPaused,
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

					if (timeout) clearTimeout(timeout);

					dispatch(peersActions.updateTranscript({ id, peerId, transcript, done }));

					const newTimeout = window.setTimeout(() => {
						dispatch(peersActions.removeTranscript({ id, peerId }));

						transcriptTimeouts.delete(id);
					}, done ? 5000 : 15000);

					transcriptTimeouts.set(id, newTimeout);

					dispatch(peersActions.updateTranscript({ id, peerId, transcript, done }));
				});

				// Server has changed the state of a Consumer/Producer, update the store.
				mediaService.on('consumerClosed', (consumer) => {
					dispatch(consumersActions.removeConsumer({ consumerId: consumer.id }));
				});

				mediaService.on('consumerPaused', (consumer) => {
					dispatch(consumersActions.setConsumerPaused({ consumerId: consumer.id, local: false }));
				});

				mediaService.on('consumerResumed', (consumer) => {
					dispatch(consumersActions.setConsumerResumed({ consumerId: consumer.id, local: false }));
				});

				mediaService.on('mediaClosed', (source) => {
					logger.debug('mediaClosed() [source:%s]', source);

					if (source === 'webcam') {
						if (!mediaService.mediaSenders['webcam'].paused) {
							dispatch(meActions.setLostVideo(true));
							dispatch(meActions.setVideoMuted(true));
						}

						dispatch(meActions.setWebcamEnabled(false));
					}

					if (source === 'mic') {
						if (!mediaService.mediaSenders['mic'].paused) {
							dispatch(meActions.setLostAudio(true));
							dispatch(meActions.setAudioMuted(true));
						}

						dispatch(meActions.setMicEnabled(false));
					}

					if (source === 'screen') {
						dispatch(meActions.setScreenEnabled(false));
					}

					if (source === 'screenaudio') {
						dispatch(meActions.setScreenAudioEnabled(false));
					}

					if (source === 'extravideo') {
						dispatch(meActions.setExtraVideoEnabled(false));
					}

					if (source === 'extraaudio') {
						dispatch(meActions.setExtraAudioEnabled(false));
					}
				});
			
				mediaService.on('lostMediaServer', () => {
					batch(() => {
						dispatch(notificationsActions.enqueueNotification({
							message: 'Lost connection to media server, reconnecting...',
							options: { variant: 'error' }
						}));

						if (getState().me.lostAudio) {
							dispatch(meActions.setLostAudio(false));
							dispatch(updateMic());
						}

						if (getState().me.lostVideo) {
							dispatch(meActions.setLostVideo(false));
							dispatch(updateWebcam());
						}
					});
				});
			}

			if (roomActions.setState.match(action) && action.payload === 'left') {
				mediaService.removeAllListeners();
				mediaService.close();
			}

			// These actions are dispatched from the UI somewhere manually (button clicks, etc)
			// We need to make the mediaService aware of the actions.
			if (consumersActions.setConsumerPaused.match(action) && action.payload.local)
				mediaService.changeConsumer(action.payload.consumerId, 'pause');

			if (consumersActions.setConsumerResumed.match(action) && action.payload.local)
				mediaService.changeConsumer(action.payload.consumerId, 'resume');

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
				const oldConsumersList = resumedVideoConsumersSelector(getState());

				next(action);

				const newConsumersList = resumedVideoConsumersSelector(getState());

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

				pausedConsumersList.forEach(({ id: consumerId, peerId }) => {
					if (peerId !== removedPeerId && consumerId !== removedConsumerId) {
						mediaService.changeConsumer(consumerId, 'pause');
						dispatch(consumersActions.setConsumerPaused({ consumerId }));
					}
				});

				resumedConsumersList.forEach(({ id: consumerId, peerId }) => {
					if (peerId !== removedPeerId && consumerId !== removedConsumerId) {
						mediaService.changeConsumer(consumerId, 'resume');
						dispatch(consumersActions.setConsumerResumed({ consumerId }));
					}
				});

				return;
			}

			return next(action);
		};
	
	return middleware;
};

export default createMediaMiddleware;
