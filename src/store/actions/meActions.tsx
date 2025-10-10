import { ImageKeys, ThumbnailItem } from '../../services/clientImageService';
import { Logger } from '../../utils/Logger';
import { meActions } from '../slices/meSlice';
import { settingsActions } from '../slices/settingsSlice';
import { AppThunk } from '../store';
import edumeetConfig from '../../utils/edumeetConfig';

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
 * This thunk action sets the reaction state of the client.
 * 
 * @param reaction - The reaction to send.
 * @returns {AppThunk<Promise<void>>} Promise.
 */
export const setSendReaction = (reaction: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('setSendReaction() [reaction:%s]', reaction);

	dispatch(meActions.setSendReactionInProgress(true));

	try {
		await signalingService.sendRequest('reaction', { reaction });

		dispatch(meActions.setSendReaction(reaction));

		// Set timeout to clear reaction after specified time
		window.setTimeout(() => {
			dispatch(meActions.setSendReaction(null));
			dispatch(meActions.setSendReactionInProgress(false));
		}, edumeetConfig.reactionsTimeout || 10000);
	} catch (error) {
		logger.error('setSendReaction() [error:"%o"]', error);

		dispatch(meActions.setSendReaction(null));
		dispatch(meActions.setSendReactionInProgress(false));
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

/**
 * 
 * @param imageName image file name
 */
export const setUserBackground = (
	imageName: string,
): AppThunk<void> => async (
	dispatch,
	_getState,
	{ clientImageService }
) => {
	await clientImageService.setEarmarkedImage(imageName, ImageKeys.DESKTOP_BACKGROUND);
	const imageUrl: string | null = await clientImageService.getEarmarkedImage(ImageKeys.DESKTOP_BACKGROUND);

	imageUrl
		? dispatch(meActions.setSelectedDestop({ imageName, imageUrl }))
		: dispatch(meActions.setSelectedDestop(null));
};

/**
 * Loads userBackground from persistent storage
 */
export const loadUserBackground = (
): AppThunk<Promise<void>> => async (dispatch, _getState, { clientImageService }) => {
	const imageUrl : string | null = await clientImageService.loadEarmarkedImage(ImageKeys.DESKTOP_BACKGROUND);

	imageUrl
		? dispatch(meActions.setSelectedDestop({ imageName: ImageKeys.DESKTOP_BACKGROUND, imageUrl }))
		: dispatch(meActions.setSelectedDestop(null));
};

/**
 * Loads thumbnailList from persistent storage
 */
export const loadThumbnails = (
): AppThunk<Promise<void>> => async (dispatch, _getState, { clientImageService }) => {
	const thumbnails = await clientImageService.loadThumbnails();

	dispatch(meActions.setThumbnailList(thumbnails));
};

/**
 * Saves image and also a thumbnail.
 * 
 * @param image 
 * @returns 
 */
export const saveImage = (
	image: File,
): AppThunk<Promise<ThumbnailItem>> => async (
	dispatch, _getState, { clientImageService }
) => {
	const thumbnailItem = await clientImageService.saveImageAndThumbnail(image);

	dispatch(meActions.addThumbnail(thumbnailItem));

	return thumbnailItem;
};

/**
 * Get image with file name
 * 
 * @param name 
 * @returns 
 */
export const getImage = (
	name: string,
): AppThunk<Promise<File | undefined>> => async (_dispatch, _getState, { clientImageService }) => {
	return await clientImageService.getImage(name);
};

/**
 * Deletes image and revokes its object url
 */
export const deleteImage = (
	thumbnail: ThumbnailItem,
): AppThunk<Promise<void>> => async (dispatch, getState, { clientImageService }) => {
	await clientImageService.deleteImage(thumbnail);
	const newThumbnailList = getState().me.thumbnailList.filter((thumb) => thumb.imageName != thumbnail.imageName);

	dispatch(meActions.setThumbnailList(newThumbnailList));
};

/**
 * Clear storage and revokes object urls
 */
export const clearImageStorage = (
): AppThunk<Promise<void>> => async (dispatch, getState, { clientImageService }) => {
	await clientImageService.clearStorage(getState().me.thumbnailList);
	dispatch(meActions.setThumbnailList([]));
};
