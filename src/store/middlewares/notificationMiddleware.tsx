import { Middleware } from '@reduxjs/toolkit';
import { lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { peersActions } from '../slices/peersSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { roomActions } from '../slices/roomSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { HTMLMediaElementWithSink } from '../../utils/types';
import { isSinkIdSupported } from '../selectors';
import { settingsActions } from '../slices/settingsSlice';
import { Logger } from '../../utils/Logger';
import { peerJoinedRoomLabel, peersJoinedRoomLabel } from '../../components/translated/translatedComponents';

interface SoundAlert {
	[type: string]: {
		audio: HTMLMediaElementWithSink;
		debounce: number;
		last?: number;
	};
}

// Batch "peer joined" snackbars so a burst of simultaneous joins collapses into
// a single notification instead of flooding existing participants. The first
// join shows immediately (no lag for the common single-join case) and opens a
// window during which further joins are gathered into one follow-up notification.
const JOIN_NOTIFICATION_DEBOUNCE = 1500;
const JOIN_NOTIFICATION_MAX_WAIT = 3000;

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
			if (isSinkIdSupported())
				alert.audio.setSinkId(deviceId).catch((e) => logger.error(e));
		});
	};

	let initialSinkApplied = false;

	let pendingJoinNames: string[] = [];
	let joinDebounceTimer: ReturnType<typeof setTimeout> | undefined;
	let joinFirstSeen = 0;

	const middleware: Middleware = ({
		getState,
		dispatch
	}: {
		getState: () => RootState;
		dispatch: AppDispatch;
	}) => {
		// Flush the gathered joiners into a single follow-up notification.
		const flushJoinNotifications = () => {
			if (joinDebounceTimer) {
				clearTimeout(joinDebounceTimer);
				joinDebounceTimer = undefined;
			}

			const names = pendingJoinNames;

			pendingJoinNames = [];
			joinFirstSeen = 0;

			if (names.length === 0) return;

			const message = names.length === 1
				? peerJoinedRoomLabel(names[0])
				: peersJoinedRoomLabel(names.length);

			dispatch(notificationsActions.enqueueNotification({ message }));
		};

		// (Re)arm the gather window. Debounce on quiet, but never wait past the
		// max window measured from the first join that opened it.
		const scheduleFlush = () => {
			if (joinDebounceTimer) clearTimeout(joinDebounceTimer);

			const wait = Math.min(
				JOIN_NOTIFICATION_DEBOUNCE,
				Math.max(0, joinFirstSeen + JOIN_NOTIFICATION_MAX_WAIT - Date.now())
			);

			joinDebounceTimer = setTimeout(flushJoinNotifications, wait);
		};

		const queueJoinNotification = (displayName?: string) => {
			const name = displayName || 'Someone';

			// Leading edge: the first join after an idle period shows immediately
			// and opens a window during which further joins are gathered.
			if (joinFirstSeen === 0) {
				joinFirstSeen = Date.now();

				dispatch(notificationsActions.enqueueNotification({
					message: peerJoinedRoomLabel(name),
				}));

				scheduleFlush();

				return;
			}

			pendingJoinNames.push(name);

			scheduleFlush();
		};

		return (next) => (action) => {
			// New peer joined: batch the snackbar (independent of sound settings).
			if (peersActions.addPeer.match(action)) {
				queueJoinNotification(action.payload.displayName);
			}

			// Drop any pending join notifications when the user leaves the room.
			if (roomActions.setState.match(action) && action.payload === 'left') {
				if (joinDebounceTimer) clearTimeout(joinDebounceTimer);
				joinDebounceTimer = undefined;
				pendingJoinNames = [];
				joinFirstSeen = 0;
			}

			if (!initialSinkApplied) {
				initialSinkApplied = true;
				const deviceId = getState().settings.selectedAudioOutputDevice;

				if (deviceId) attachAudioOutput(deviceId);
			}
			// Reproduce notification alerts
			if (getState().settings.notificationSounds) {
				if (peersActions.updatePeer.match(action)) {
					const { raisedHand, reaction } = action.payload;

					// Raised hand
					if (raisedHand) playNotificationSounds('raisedHand');

					// Reactions
					if (reaction && config.reactionsSoundEnabled) {
					// Construct a sound key like 'reactionThumbup' for reaction "thumbup"
						const soundKey = `reaction${reaction.charAt(0).toUpperCase() + reaction.slice(1)}`;
					
						playNotificationSounds(soundKey);
					}
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

				// Finished countdownTimer
				if (roomActions.finishCountdownTimer.match(action)) {
					playNotificationSounds('finishedCountdownTimer');
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
	};

	return middleware;
};

export default createNotificationMiddleware;
