import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { peersActions } from '../slices/peersSlice';
import { MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { mediaActions } from '../slices/mediaSlice';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { meActions } from '../slices/meSlice';

interface SoundAlert {
	audio: HTMLMediaElementWithSink,
	debounce: number,
	last?: number
}

const soundAlerts = new Map<string, SoundAlert>();

const logger = new Logger('NotificationMiddleware');

const createNotificationMiddleware = ({
	config, mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createNotificationMiddleware()');

	const defaultSoundAlert: SoundAlert = {
		audio: new Audio('/sounds/notify.mp3') as HTMLMediaElementWithSink,
		debounce: 0
	};

	const attachAudioOutput = (outputDeviceId: string) => {
		soundAlerts.forEach((sa) => {
			sa.audio.setSinkId(outputDeviceId).catch((e) => logger.error(e));
		});
		defaultSoundAlert.audio.setSinkId(outputDeviceId);
	};

	const playNotificationSound = async (type: string) => {
		const soundAlert = soundAlerts.get(type) ?? defaultSoundAlert;

		const now = Date.now();

		if (soundAlert?.last && (now - soundAlert.last) < soundAlert.debounce)
			return;

		soundAlert.last = now;

		await soundAlert.audio.play().catch((error) => {
			logger.error('playNotificationSound() [error:"%o"]', error);
		});
	};

	// Load notification alerts sounds and make them available
	const loadNotificationSounds = (hasIOSAudioContext?: boolean) => {
		for (const [ k, v ] of Object.entries(config.notificationSounds)) {

			if (v?.play) {
				const audio = new Audio(v.play) as HTMLMediaElementWithSink;

				if (hasIOSAudioContext) {
					const ctx = mediaService.audioContext;

					if (!ctx) return;

					const src = ctx.createMediaElementSource(audio);

					src.connect(ctx.destination);
				}

				soundAlerts.set(k, {
					audio,
					debounce: v.debounce ?? 0
				});
			}
		}

	};

	loadNotificationSounds();

	const middleware: Middleware = ({
		getState
	}: {
		getState: () => RootState
	}) =>
		(next) => async (action) => {
			// Reproduce notification alerts
			if (getState().settings.notificationSounds) {
				// Raised hand
				if (peersActions.updatePeer.match(action)) {
					const { raisedHand } = action.payload;

					if (raisedHand) await playNotificationSound('raisedHand');
				}

				// Chat message
				if (
					roomSessionsActions.addMessage.match(action) &&
					action.payload.peerId !== getState().me.id
				) {
					await playNotificationSound('chatMessage');
				}

				// Parked peer
				if (lobbyPeersActions.addPeer.match(action)) {
					await playNotificationSound('parkedPeer');
				}

				// Send file
				if (roomSessionsActions.addFile.match(action)) {
					await playNotificationSound('sendFile');
				}

				// New peer
				if (peersActions.addPeer.match(action)) {
					await playNotificationSound('newPeer');
				}

				if (mediaActions.testAudioOutput.match(action)) {
					await playNotificationSound('testAudioOutput');
				}

				if (mediaActions.setPreviewAudioOutputDeviceId.match(action)) {
					if (action.payload) attachAudioOutput(action.payload);
				}
				
				if (mediaActions.setLiveAudioOutputDeviceId.match(action)) {
					if (action.payload) attachAudioOutput(action.payload);
				}
			}

			if (meActions.activateAudioContext.match(action)) {
				soundAlerts.clear();
				loadNotificationSounds(true);
			}

			return next(action);
		};

	return middleware;
};

export default createNotificationMiddleware;