import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { permissionsActions } from '../slices/permissionsSlice';
import { notificationsActions } from '../slices/notificationsSlice';
import { permissionGrantedLabel, permissionRevokedLabel } from '../../components/translated/translatedComponents';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PermissionsMiddleware');

// Batch window: multiple permissionAdded/Removed notifications from a single
// server-side `Peer.permissions = [...]` setter call arrive back-to-back;
// we group them into one snackbar per direction.
const BATCH_MS = 150;

const createPermissionsMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createPermissionsMiddleware()');

	const middleware: Middleware = ({
		dispatch,
		getState,
	}: {
		dispatch: AppDispatch,
		getState: () => RootState,
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				const pendingAdded = new Set<string>();
				const pendingRemoved = new Set<string>();
				let flushTimeout: ReturnType<typeof setTimeout> | null = null;

				const flush = (): void => {
					flushTimeout = null;

					if (getState().room.state !== 'joined') {
						pendingAdded.clear();
						pendingRemoved.clear();

						return;
					}

					if (pendingAdded.size > 0) {
						dispatch(notificationsActions.enqueueNotification({
							message: permissionGrantedLabel([ ...pendingAdded ].join(', ')),
							options: { variant: 'success' },
						}));
						pendingAdded.clear();
					}

					if (pendingRemoved.size > 0) {
						dispatch(notificationsActions.enqueueNotification({
							message: permissionRevokedLabel([ ...pendingRemoved ].join(', ')),
							options: { variant: 'warning' },
						}));
						pendingRemoved.clear();
					}
				};

				const schedule = (perm: string, kind: 'added' | 'removed'): void => {
					if (kind === 'added') {
						pendingAdded.add(perm);
						pendingRemoved.delete(perm);
					} else {
						pendingRemoved.add(perm);
						pendingAdded.delete(perm);
					}

					if (flushTimeout === null) {
						flushTimeout = setTimeout(flush, BATCH_MS);
					}
				};

				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'signInRequired': {
								dispatch(permissionsActions.setLoggedIn(false));
								dispatch(permissionsActions.setSignInRequired(true));
								break;
							}

							case 'lockRoom': {
								dispatch(permissionsActions.setLocked(true));
								break;
							}

							case 'unlockRoom': {
								dispatch(permissionsActions.setLocked(false));
								break;
							}

							case 'permissionAdded': {
								dispatch(permissionsActions.addPermission(notification.data.permission));
								schedule(notification.data.permission, 'added');
								break;
							}

							case 'permissionRemoved': {
								dispatch(permissionsActions.removePermission(notification.data.permission));
								schedule(notification.data.permission, 'removed');
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			return next(action);
		};

	return middleware;
};

export default createPermissionsMiddleware;
