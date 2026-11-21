import type { AppThunk } from '../store';
import { MeetingTokenRejection, meetingTokenWindow, storeMeetingTokenRejection } from '../../utils/meetingToken';

export const meetingTokenRejected = (
	reason: MeetingTokenRejection,
	data?: { startsAt?: unknown, endsAt?: unknown }
): AppThunk<void> => (dispatch, getState): void => {
	storeMeetingTokenRejection({ reason, meetingToken: getState().me.meetingToken, ...meetingTokenWindow(data) });
	window.location.reload();
};
