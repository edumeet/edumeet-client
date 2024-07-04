import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/Logger';

import { countdownTimerActions } from '../slices/countdownTimerSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { notificationsActions } from '../slices/notificationsSlice';
import { countdownTimerFinishedLabel } from '../../components/translated/translatedComponents';

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

							case 'moderator:settedCountdownTimerInitialTime': {
		
								const time = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimerInitialTime(time));
								
								break;
							}

							case 'moderator:settedCountdownTimerRemainingTime': {
		
								const time = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimerRemainingTime(time));
		
								break;
							}
								
							case 'moderator:finishedCountdownTimer': {
		
								const isStarted = notification.data.isStarted;
								const remainingTime = notification.data.remainingTime;
								
								dispatch(countdownTimerActions.finishCountdownTimer({ isStarted, remainingTime }));

								dispatch(notificationsActions.enqueueNotification({
									message: countdownTimerFinishedLabel(),
									options: { variant: 'info' }
								}));
		
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