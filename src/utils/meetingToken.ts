import type { Meeting } from './types';

export type MeetingTokenRejection = 'required' | 'invalid';

export interface StoredMeetingTokenRejection {
	reason: MeetingTokenRejection;
	meetingToken?: string;
}

export const MEETING_TOKEN_REJECTION_KEY = 'edumeet.meetingTokenRejection';

export const normalizeMeetingToken = (raw: string | null | undefined): string | undefined => {
	if (typeof raw !== 'string') return undefined;

	const token = raw.trim().toUpperCase();

	return token.length > 0 ? token : undefined;
};

export const meetingTokenFromUrl = (href: string): string | undefined =>
	normalizeMeetingToken(new URL(href).searchParams.get('meetingToken'));

export const roomPathWithMeetingToken = (roomName: string, meetingToken?: string): string =>
	(meetingToken ? `/${roomName}?meetingToken=${encodeURIComponent(meetingToken)}` : `/${roomName}`);

export const meetingJoinPath = (meeting: Meeting): string =>
	roomPathWithMeetingToken(meeting.room?.name ?? '', meeting.room?.meetingsOnly ? meeting.meetingToken : undefined);

export const storeMeetingTokenRejection = (rejection: StoredMeetingTokenRejection): void => {
	try {
		sessionStorage.setItem(MEETING_TOKEN_REJECTION_KEY, JSON.stringify(rejection));
	} catch {
		// sessionStorage may be unavailable (private mode); the dialog then simply opens without the field
	}
};

export const takeMeetingTokenRejection = (): StoredMeetingTokenRejection | undefined => {
	try {
		const raw = sessionStorage.getItem(MEETING_TOKEN_REJECTION_KEY);

		if (!raw) return undefined;
		sessionStorage.removeItem(MEETING_TOKEN_REJECTION_KEY);

		const parsed = JSON.parse(raw) as Partial<StoredMeetingTokenRejection>;

		if (parsed.reason !== 'required' && parsed.reason !== 'invalid') return undefined;

		return { reason: parsed.reason, meetingToken: normalizeMeetingToken(parsed.meetingToken) };
	} catch {
		return undefined;
	}
};
