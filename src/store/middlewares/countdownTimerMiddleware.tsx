import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/Logger';

import { countdownTimerActions } from '../slices/countdownTimerSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('ChatMiddleware');

const createCountdownTimerMiddleware = ({
	signalingService
}: MiddlewareOptions): Middleware => {
	logger.debug('createChatMiddleware()');

	const middleware: Middleware = ({
		dispatch, getState
	}: {
		dispatch: AppDispatch,
		getState: () => RootState
	}) =>
		(next) => (action) => {

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							
							case 'moderator:enabledCountdownTimer': {
 
								dispatch(countdownTimerActions.enableCountdownTimer());

								break;
							}

							case 'moderator:disabledCountdownTimer': {
 
								dispatch(countdownTimerActions.disableCountdownTimer());

								break;
							}
							case 'moderator:startedCountdownTimer': {
 
								dispatch(countdownTimerActions.startCountdownTimer());

								break;
							}

							case 'moderator:stoppedCountdownTimer': {
 
								dispatch(countdownTimerActions.stopCountdownTimer());

								break;
							}

							case 'moderator:setCountdownTimer': {
		
								const { timeLeft, timeSet, isStarted } = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimer(
									{ timeLeft, isStarted }));

								dispatch(countdownTimerActions.setCountdownTimerTimeSet(
									{ timeSet, isStarted }));
		
								break;
							}

							case 'moderator:updatedCountdownTimer': {
		
								const { timeLeft, isStarted } = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimer(
									{ timeLeft, isStarted }));
		
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

export default createCountdownTimerMiddleware;