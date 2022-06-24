import { Logger } from '../../utils/logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';

const logger = new Logger('MeActions');

export const setDisplayName = (displayName: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
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

export const setPicture = (picture: string) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
): Promise<void> => {
	logger.debug('setPicture() [picture:%s]', picture);

	try {
		await signalingService.sendRequest('changePicture', { picture });

		dispatch(meActions.setPicture(picture));
	} catch (error) {
		logger.error('setPicture() [error:"%o"]', error);
	}
};

export const setRaisedHand = (raisedHand: boolean) => async (
	dispatch: AppDispatch,
	_getState: RootState,
	{ signalingService }: MiddlewareOptions
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