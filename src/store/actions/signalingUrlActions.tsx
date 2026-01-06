import { AppThunk } from '../store';
import { signalingActions } from '../slices/signalingSlice';
import { Logger } from '../../utils/Logger';

const logger = new Logger('SignalingUrlActions');

export type SyncSignalingUrlParams = {
	token?: string | null;
	reconnectKey?: string | null;
};

export const syncSignalingUrl = ({
	token,
	reconnectKey
}: SyncSignalingUrlParams): AppThunk<void> => (
	dispatch,
	getState
): void => {
	const currentUrl = getState().signaling.url;

	if (!currentUrl)
		return;

	let nextUrl: string;

	try {
		const u = new URL(currentUrl);

		// Update only if key is present in the argument object
		if (token !== undefined) {
			if (token)
				u.searchParams.set('token', token);
			else
				u.searchParams.delete('token');
		}

		if (reconnectKey !== undefined) {
			if (reconnectKey)
				u.searchParams.set('reconnectKey', reconnectKey);
			else
				u.searchParams.delete('reconnectKey');
		}

		nextUrl = u.toString();
	} catch {
		return;
	}

	if (nextUrl !== currentUrl)
		dispatch(signalingActions.setUrl(nextUrl));
};
