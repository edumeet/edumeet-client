import { Middleware } from '@reduxjs/toolkit';
import { Logger } from '../../utils/Logger';

import { countdownTimerActions } from '../slices/countdownTimerSlice';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import moment from 'moment';

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

			const countdownTimer = getState().countdownTimer;
			let _countdownTimerRef : any;

			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							
							case 'moderator:enableCountdownTimer': {
 
								dispatch(countdownTimerActions.enableCountdownTimer());

								break;
							}

							case 'moderator:disableCountdownTimer': {
 
								dispatch(countdownTimerActions.disableCountdownTimer());

								break;
							}
							case 'moderator:startedCountdownTimer': {
 
								dispatch(countdownTimerActions.startCountdownTimer());

								// clearInterval(_countdownTimerRef);

								// _countdownTimerRef = setInterval(() => {
								// 	let left = moment(`1000-01-01 ${countdownTimer.left}`).unix();
								// 	const end = moment('1000-01-01 00:00:00').unix();
				
								// 	left--;
					
								// 	const left2 = moment.unix(left).format('HH:mm:ss');

								// 	dispatch(countdownTimerActions.setCountdownTimer({ left: left2 }));

								// 	// countdownTimer.left = moment.unix(left).format('HH:mm:ss');
					
								// 	// if (left === end) {
								// 	// 	// if (left === end || room.empty) {
								// 	// 	clearInterval(_countdownTimerRef);
					
								// 	// 	dispatch(countdownTimerActions.stopCountdownTimer());
								// 	// 	dispatch(countdownTimerActions.setCountdownTimer({ left: '00:00:00' }));
					
								// 	// 	// countdownTimer.isRunning = false;
								// 	// 	// countdownTimer.left = '00:00:00';
				
								// 	// 	// room.notifyPeers('moderator:setCountdownTimer', {
								// 	// 	// 	peerId: peer.id,
								// 	// 	// 	left: countdownTimer.left,
								// 	// 	// 	// isRunning: countdownTimer.isRunning
								// 	// 	// });
				
								// 	// 	// room.notifyPeers('moderator:stoppedCountdownTimer', {
								// 	// 	// 	peerId: peer.id,
								// 	// 	// 	isRunning: countdownTimer.isRunning
								// 	// 	// });
								// 	// }
					
								// }, 1000);

								break;
							}

							case 'moderator:stoppedCountdownTimer': {
								// const { isEnabled } = notification.data;
 
								dispatch(countdownTimerActions.stopCountdownTimer());

								break;
							}

							// case 'moderator:toggleCountdownTimer': {
							// 	const { isEnabled } = notification.data;
 
							// 	dispatch(countdownTimerActions.toggleCountdownTimer(isEnabled));

							// 	// store.dispatch(requestActions.notify(
							// 	// 	{
							// 	// 		type : 'info',
							// 	// 		text : intl.formatMessage({
							// 	// 			id             : 'xxx',
							// 	// 			defaultMessage : 'Countdown timer is updated'
							// 	// 		})
							// 	// 	}));

							// 	break;
							// }

							case 'moderator:settedCountdownTimer': {
		
								const { left, isRunning } = notification.data;
		
								dispatch(countdownTimerActions.setCountdownTimer(
									{ left, isRunning }));
		
								// if (arr.includes(left) && isRunning) {
								// if (left == arr[0] && isRunning) {
								// 	dispatch(countdownTimerActions.notify(
								// 		{
								// 			type: 'info',
								// 			text: intl.formatMessage({
								// 				id: 'xxx',
								// 				defaultMessage: 'Time is up'
								// 			})
								// 		}));
		
								// 	this._soundNotification('countdownTimer');
								// }

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