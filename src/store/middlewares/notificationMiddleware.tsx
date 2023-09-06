import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { peersActions } from '../slices/peersSlice';
import { MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { mediaActions } from '../slices/mediaSlice';
import { HTMLMediaElementWithSink, NotificationSound } from '../../utils/types';
import { meActions } from '../slices/meSlice';

interface SoundAlert {
	audio: HTMLMediaElementWithSink,
	debounce: number,
	last?: number
}

const notificationSounds = new Map<string, SoundAlert>();

const logger = new Logger('NotificationMiddleware');

const createNotificationMiddleware = ({
	config, mediaService
}: MiddlewareOptions): Middleware => {
	logger.debug('createNotificationMiddleware()');

	const attachAudioOutput = (outputDeviceId: string) => {
		notificationSounds.forEach((sound) => {
			sound.audio.setSinkId(outputDeviceId).catch((e) => logger.error(e));
		});
	};

	const playNotificationSound = async (type: string) => {
		const notificationSound = notificationSounds.get(type) ?? notificationSounds.get('default');

		if (!notificationSound) return;

		const now = Date.now();

		if (notificationSound?.last && (now - notificationSound.last) < notificationSound.debounce)
			return;

		notificationSound.last = now;

		await notificationSound.audio.play().catch((error) => {
			logger.error('playNotificationSound() [error:"%o"]', error);
		});
	};

	// Load notification alerts sounds and make them available
	const loadNotificationSounds = async ({ useAudioContext }: { useAudioContext: boolean}) => {
		logger.debug('loadNotificationSounds() [useAudioContext: %s]', useAudioContext);
		// Audio context handling for unlocking audio on ios.
		const ctx = mediaService.audioContext;

		if (useAudioContext && ctx) {
			try {
				ctx.state === 'suspended' && await ctx.resume();
			} catch (e) {
				logger.error(e);
			}
		}

		// Load default notification sound.
		const notificationSound = { play: '/sounds/notify.mp3', debounce: 0 };

		loadNotificationSound({ name: 'default', notificationSound, useAudioContext, ctx });

		// Load notification sounds from config.
		for (const [ name, ns ] of Object.entries(config.notificationSounds)) {
			loadNotificationSound({ name, notificationSound: ns, useAudioContext, ctx });
		}
	};

	interface LoadSoundAlertOptions {
		name: string,
		notificationSound: NotificationSound,
		useAudioContext: boolean
		ctx?: AudioContext
	}
	const loadNotificationSound = ({ name, notificationSound, useAudioContext, ctx }: LoadSoundAlertOptions) => {
		logger.debug('loadNotificationSound() [name: %s, useAudioContext: %s]', name, useAudioContext);
		const { play, debounce } = notificationSound;

		if (play) {
			const audio = new Audio(play) as HTMLMediaElementWithSink;

			// Audio context handling for unlocking audio on ios.
			if (useAudioContext && ctx) {
				const src = ctx.createMediaElementSource(audio);

				src.connect(ctx.destination);
			}
			notificationSounds.set(name, {
				audio,
				debounce: debounce ?? 0
			});
		}
	};

	const useAudioContext = typeof mediaService.audioContext !== 'undefined';

	loadNotificationSounds({ useAudioContext }).catch((e) => logger.error(e));

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
				notificationSounds.clear();
				await loadNotificationSounds({ useAudioContext: true });
			}

			return next(action);
		};

	return middleware;
};

export default createNotificationMiddleware;