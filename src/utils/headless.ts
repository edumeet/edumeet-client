import { settingsActions } from '../store/slices/settingsSlice';
import type { LeaveReason } from '../store/slices/roomSlice';
import type { MeetingTokenRejection } from './meetingToken';

export interface LayoutSettings {
	hideSelfView: boolean;
	groupAudioOnly: boolean;
	hideNonVideo: boolean;
	notificationSounds: boolean;
}

// What a recorder page needs to look like a clean room: no self view, a tile
// per participant without video, nothing hidden, and no sounds in the capture.
export const HEADLESS_PRESET: LayoutSettings = {
	hideSelfView: true,
	groupAudioOnly: false,
	hideNonVideo: false,
	notificationSounds: false,
};

// `1`/`true` turn the headless view on, `0`/`false` turn it off and undo the
// preset, anything else leaves the client as it is.
export const headlessFromUrl = (href?: string): boolean | undefined => {
	if (!href) return undefined;

	let value: string | null;

	try {
		value = new URL(href).searchParams.get('headless');
	} catch {
		return undefined;
	}

	if (value === '1' || value === 'true') return true;
	if (value === '0' || value === 'false') return false;

	return undefined;
};

export const layoutSettingsActions = ({ hideSelfView, groupAudioOnly, hideNonVideo, notificationSounds }: LayoutSettings) => [
	settingsActions.setHideSelfView(hideSelfView),
	settingsActions.setGroupAudioOnly(groupAudioOnly),
	settingsActions.setHideNonVideo(hideNonVideo),
	settingsActions.setNotificationSounds(notificationSounds),
];

export interface HeadlessJoinPlan {
	reason?: LeaveReason;
	autoJoin: boolean;
}

// What a headless page does on arrival: join, or stay on the background and say why.
export const headlessJoinPlan = ({ rejection, joinErrorPending }: {
	rejection?: MeetingTokenRejection,
	joinErrorPending: boolean,
}): HeadlessJoinPlan => {
	if (rejection) return { reason: rejection === 'invalid' ? 'meetingTokenInvalid' : 'meetingTokenRequired', autoJoin: false };
	if (joinErrorPending) return { reason: 'joinErrorPending', autoJoin: false };

	return { autoJoin: true };
};
