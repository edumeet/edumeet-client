import { Logger } from '../../utils/Logger';
import { roomActions } from '../slices/roomSlice';
import { AppThunk } from '../store';

const logger = new Logger('CountdownTimerActions');

/**
 * This thunk action enables the countdown timer.
 * 
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

		dispatch(roomActions.enableCountdownTimer());
	} catch (error) {
		logger.error('moderator:enableCountdownTimer() [error:"%o"]', error);
	}
};

/** 
 * This thunk action disables the countdown timer.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 */
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

		dispatch(roomActions.disableCountdownTimer());
	} catch (error) {
		logger.error('moderator:disableCountdownTimer() [error:"%o"]', error);
	}
};

/**
 * 
 * This thunk action starts the countdown timer.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 * 
 */
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

/**
 * 
 * This thunk action stops the countdown timer.
 * 
 * @returns {AppThunk<Promise<void>>} Promise.
 *
 */
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

/**
 * 
 * This thunk action sets the countdown timer remaining time.
 * 
 * @param time - Time to set.
 * @returns {AppThunk<Promise<void>>} Promise.
 *
 */
export const setCountdownTimerInitialTime = (time : string): 
AppThunk<Promise<void>> => async (
	dispatch,
	getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setCountdownTimerInitialTime() [time:"%s"]', time);

	try {
		
		signalingService.sendRequest('moderator:setCountdownTimerInitialTime', time);

		dispatch(roomActions.setCountdownTimerRemainingTime(time));
		
		dispatch(roomActions.setCountdownTimerInitialTime(time));

	} catch (error) {
		logger.error('setCountdownTimer() [error:"%o"]', error);
	}
};