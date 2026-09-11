import type { AppThunk } from '../store';
import { MeetingTokenRejection, storeMeetingTokenRejection } from '../../utils/meetingToken';

export const meetingTokenRejected = (reason: MeetingTokenRejection): AppThunk<void> => (dispatch, getState): void => {
	storeMeetingTokenRejection({ reason, meetingToken: getState().me.meetingToken });
	window.location.reload();
};
