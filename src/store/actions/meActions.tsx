import { Logger } from '../../utils/Logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';

const logger = new Logger('MeActions');

/**
 * This thunk action sets the display name of the client.
 * 
 * @param displayName - Display name.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setDisplayName = (displayName: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setDisplayName() [displayName:%s]', displayName);

	dispatch(meActions.setDispayNameInProgress(true));

	try {
		await signalingService.sendRequest('changeDisplayName', { displayName });

		dispatch(settingsActions.setDisplayName(displayName));
	} catch (error) {
		logger.error('setDisplayName() [error:%o]', error);
	} finally {
		dispatch(meActions.setDispayNameInProgress(false));
	}
};

/**
 * This thunk action sets the picture of the client.
 * 
 * @param picture - Picture.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setPicture = (picture: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setPicture() [picture:%s]', picture);

	try {
		await signalingService.sendRequest('changePicture', { picture });

		dispatch(meActions.setPicture(picture));
	} catch (error) {
		logger.error('setPicture() [error:"%o"]', error);
	}
};

/**
 * This thunk action sets the raised hand state of the client.
 * 
 * @param raisedHand - Raised hand.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setRaisedHand = (raisedHand: boolean): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setRaisedHand() [raisedHand:%s]', raisedHand);

	dispatch(meActions.setRaiseHandInProgress(true));

	try {
		await signalingService.sendRequest('raisedHand', { raisedHand });

		dispatch(meActions.setRaisedHand(raisedHand));
	} catch (error) {
		logger.error('setRaisedHand() [error:"%o"]', error);

		dispatch(meActions.setRaisedHand(!raisedHand));
	} finally {
		dispatch(meActions.setRaiseHandInProgress(false));
	}
};

/**
 * This thunk action sets the escape meeting state of the client.
 * 
 * @param escapeMeeting - Escape meeting.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setEscapeMeeting = (
	escapeMeeting: boolean
): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setEscapeMeeting() [escapeMeeting:%s]', escapeMeeting);

	dispatch(meActions.setEscapeMeetingInProgress(true));

	try {
		await signalingService.sendRequest('escapeMeeting', { escapeMeeting });

		dispatch(meActions.setEscapeMeeting(escapeMeeting));
	} catch (error) {
		logger.error('setEscapeMeeting() [error:"%o"]', error);

		dispatch(meActions.setEscapeMeeting(!escapeMeeting));
	} finally {
		dispatch(meActions.setEscapeMeetingInProgress(false));
	}
};
