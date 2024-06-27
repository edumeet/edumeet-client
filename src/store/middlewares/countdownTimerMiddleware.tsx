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

							case 'moderator:hasSetCountdownTimer': {
		
								const { remainingTime, initialTime, isStarted } = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimer(
									{ remainingTime, isStarted }));

								dispatch(countdownTimerActions.setCountdownTimerInitialTime(
									{ initialTime, isStarted }));
		
								break;
							}

							case 'moderator:updatedCountdownTimer': {
		
								const { remainingTime, isStarted } = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimer(
									{ remainingTime, isStarted }));
		
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