import { Middleware } from '@reduxjs/toolkit';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { peersActions } from '../slices/peersSlice';
import { MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { settingsActions } from '../slices/settingsSlice';
import { Logger } from '../../utils/Logger';

interface SoundAlert {
	[type: string]: {
		audio: HTMLMediaElementWithSink;
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
		default: {
			audio: new Audio('/sounds/notify.mp3') as HTMLMediaElementWithSink,
			debounce: 0,
		},
	};

	const playNotificationSounds = (type: string, ignoreDebounce = false) => {
		const soundAlert = soundAlerts[type] ?? soundAlerts['default'];

		const now = Date.now();

		if (!ignoreDebounce && soundAlert?.last && (now - soundAlert.last) < soundAlert.debounce)
			return;

		soundAlert.last = now;

		soundAlert.audio.play().catch((error) => logger.error('soundAlert.play() [error:"%o"]', error));
	};

	// Load notification alerts sounds and make them available
	for (const [ k, v ] of Object.entries(config.notificationSounds)) {
		if (v?.play) {
			soundAlerts[k] = {
				audio: new Audio(v.play) as HTMLMediaElementWithSink,
				debounce: v.debounce ?? 0,
			};
		}
	}

	const attachAudioOutput = (deviceId: string) => {
		Object.values(soundAlerts).forEach((alert) => {
			alert.audio.setSinkId(deviceId).catch((e) => logger.error(e));
		});
	};

	const middleware: Middleware = ({
		getState
	}: {
		getState: () => RootState
	}) => (next) => (action) => {
		// Reproduce notification alerts
		if (getState().settings.notificationSounds) {
			// Raised hand
			if (peersActions.updatePeer.match(action)) {
				const { raisedHand } = action.payload;

				if (raisedHand) playNotificationSounds('raisedHand');
			}

			// Chat message
			if (
				roomSessionsActions.addMessage.match(action) &&
					action.payload.peerId !== getState().me.id
			) {
				playNotificationSounds('chatMessage');
			}

			// Parked peer
			if (lobbyPeersActions.addPeer.match(action)) {
				playNotificationSounds('parkedPeer');
			}

			// Send file
			if (roomSessionsActions.addFile.match(action)) {
				playNotificationSounds('sendFile');
			}

			// New peer
			if (peersActions.addPeer.match(action)) {
				playNotificationSounds('newPeer');
			}

			if (settingsActions.setSelectedAudioOutputDevice.match(action) && action.payload) {
				attachAudioOutput(action.payload);
			}

			if (notificationsActions.playTestSound.match(action)) {
				playNotificationSounds('default', true);
			}
		}

		return next(action);
	};

	return middleware;
};

export default createNotificationMiddleware;
