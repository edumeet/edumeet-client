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

export const botRejections = [ 'roomNotOpen', 'botsNotAllowed', 'botTokenRejected', 'sessionNotOpen', 'sessionClosed' ] as const;
export type BotRejection = typeof botRejections[number];

export const asBotRejection = (value: unknown): BotRejection | undefined =>
	botRejections.find((reason) => reason === value);

// The token rides in the fragment, which browsers never send to a server, so it
// stays out of every access log and out of the room server's URL.
export const botTokenFromUrl = (href?: string): string | undefined => {
	if (!href) return undefined;

	try {
		const value = new URLSearchParams(new URL(href).hash.replace(/^#/, '')).get('botToken');

		return value?.trim() || undefined;
	} catch {
		return undefined;
	}
};

export const hrefWithoutBotToken = (href: string): string => {
	const url = new URL(href);
	const params = new URLSearchParams(url.hash.replace(/^#/, ''));

	params.delete('botToken');
	url.hash = params.toString();

	return url.toString();
};

// The breakout session a bot is sent to record; absent means the main room.
export const botSessionFromUrl = (href?: string): string | undefined => {
	if (!href) return undefined;

	try {
		return new URL(href).searchParams.get('session')?.trim() || undefined;
	} catch {
		return undefined;
	}
};

export const botTypeFromUrl = (href?: string): string | undefined => {
	if (!href) return undefined;

	try {
		return new URL(href).searchParams.get('botType')?.trim() || undefined;
	} catch {
		return undefined;
	}
};

export const layoutSettingsActions = ({ hideSelfView, groupAudioOnly, hideNonVideo, notificationSounds }: LayoutSettings) => [
	settingsActions.setHideSelfView(hideSelfView),
	settingsActions.setGroupAudioOnly(groupAudioOnly),
	settingsActions.setHideNonVideo(hideNonVideo),
	settingsActions.setNotificationSounds(notificationSounds),
];

// A bot is named by its URL; without a usable name it must not borrow the name
// stored in the browser profile, because that name is shown to everyone as the bot's.
export const botDisplayName = (fromUrl: string | null | undefined): string => fromUrl?.trim() || 'Bot';

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
