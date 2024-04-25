import { Logger } from '../../utils/Logger';
import { countdownTimerActions } from '../slices/countdownTimerSlice';
import { AppThunk } from '../store';

const logger = new Logger('CountdownTimerActions');

/**
 * This thunk action sends a chat message.
 * 
 * @param message - Message to send.
 * @returns {AppThunk<Promise<void>>} Promise.
 */

export const enableCountdownTimer = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('moderator:enableCountdownTimer()');

	try {
		await signalingService.sendRequest('moderator:enableCountdownTimer');

		dispatch(countdownTimerActions.enableCountdownTimer());
	} catch (error) {
		logger.error('moderator:enableCountdownTimer() [error:"%o"]', error);
	}
};

export const disableCountdownTimer = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('moderator:disableCountdownTimer()');

	try {
		await signalingService.sendRequest('moderator:disableCountdownTimer');

		// const peerId = getState().me.id;

		dispatch(countdownTimerActions.disableCountdownTimer());
	} catch (error) {
		logger.error('moderator:disableCountdownTimer() [error:"%o"]', error);
	}
};

export const startCountdownTimer = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('startCountdownTimer)');

	try {
		await signalingService.sendRequest('moderator:startCountdownTimer');

	} catch (error) {
		logger.error('startCountdownTimer() [error:"%o"]', error);
	}
};

export const stopCountdownTimer = (): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('stopCountdownTimer()');

	try {
		await signalingService.sendRequest('moderator:stopCountdownTimer');

	} catch (error) {
		logger.error('stopCountdownTimer() [error:"%o"]', error);
	}
};

export const setCountdownTimer = (timeLeft : string): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setCountdownTimer() [timeLeft:"%s"]', timeLeft);

	try {
		await signalingService.sendRequest('moderator:setCountdownTimer', { timeLeft });

		dispatch(countdownTimerActions.setCountdownTimer({ timeLeft, isStarted: false }));

		dispatch(countdownTimerActions.setCountdownTimerTimeInit({ timeLeft, isStarted: false }));

	} catch (error) {
		logger.error('setCountdownTimer() [error:"%o"]', error);
	}
};