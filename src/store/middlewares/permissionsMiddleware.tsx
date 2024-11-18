import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions } from '../store';
import { permissionsActions } from '../slices/permissionsSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PermissionsMiddleware');

const createPermissionsMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createPermissionsMiddleware()');

	const middleware: Middleware = ({
		dispatch
	}: {
		dispatch: AppDispatch,
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
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
								break;
							}

							case 'permissionRemoved': {
								dispatch(permissionsActions.removePermission(notification.data.permission));
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
