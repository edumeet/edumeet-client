import { Middleware } from '@reduxjs/toolkit';
import { Logger } from 'edumeet-common';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { peersActions } from '../slices/peersSlice';
import { MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';

interface SoundAlert {
	[type: string]: {
		audio: HTMLAudioElement;
		debounce: number;
		last?: number;
	};
}

const logger = new Logger('NotificationMiddleware');

const createNotificationMiddleware = ({
	config
}: MiddlewareOptions): Middleware => {
	logger.debug('createNotificationMiddleware()');

	const soundAlerts: SoundAlert = {
		'default': {
			audio: new Audio('/sounds/notify.mp3'),
			debounce: 0
		}
	};

	const playNotificationSounds = async (type: string) => {
		const soundAlert = soundAlerts[type] ?? soundAlerts['default'];

		const now = Date.now();

		if (soundAlert?.last && (now - soundAlert.last) < soundAlert.debounce)
			return;

		soundAlert.last = now;

		await soundAlert.audio.play().catch((error) => {
			logger.error('soundAlert.play() [error:"%o"]', error);
		});
	};

	// Load notification alerts sounds and make them available
	for (const [ k, v ] of Object.entries(config.notificationSounds)) {
		if (v?.play) {
			soundAlerts[k] = {
				audio: new Audio(v.play),
				debounce: v.debounce ?? 0
			};
		}
	}

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

					if (raisedHand) await playNotificationSounds('raisedHand');
				}

				// Chat message
				if (
					roomSessionsActions.addMessage.match(action) &&
					action.payload.peerId !== getState().me.id
				) {
					await playNotificationSounds('chatMessage');
				}

				// Parked peer
				if (lobbyPeersActions.addPeer.match(action)) {
					await playNotificationSounds('parkedPeer');
				}

				// Send file
				if (roomSessionsActions.addFile.match(action)) {
					await playNotificationSounds('sendFile');
				}

				// New peer
				if (peersActions.addPeer.match(action)) {
					await playNotificationSounds('newPeer');
				}
			}

			return next(action);
		};

	return middleware;
};

export default createNotificationMiddleware;