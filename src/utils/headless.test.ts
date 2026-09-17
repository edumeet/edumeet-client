import { describe, expect, it, vi } from 'vitest';

vi.mock('./edumeetConfig', () => ({ default: { theme: {}, groupAudioOnly: true, hideNonVideo: false, hideSelfView: false } }));
vi.mock('./intlManager', () => ({ detect: () => 'en' }));

import { botDisplayName, HEADLESS_PRESET, headlessFromUrl, headlessJoinPlan, layoutSettingsActions } from './headless';
import settingsSlice from '../store/slices/settingsSlice';

describe('headlessFromUrl', () => {
	it('turns the view on for 1 and true only', () => {
		expect(headlessFromUrl('https://meet.example.edu/room?headless=1')).toBe(true);
		expect(headlessFromUrl('https://meet.example.edu/room?headless=true')).toBe(true);
	});

	it('turns the view off for 0 and false', () => {
		expect(headlessFromUrl('https://meet.example.edu/room?headless=0')).toBe(false);
		expect(headlessFromUrl('https://meet.example.edu/room?headless=false')).toBe(false);
	});

	it('does nothing for a missing, empty or other value', () => {
		expect(headlessFromUrl('https://meet.example.edu/room')).toBeUndefined();
		expect(headlessFromUrl('https://meet.example.edu/room?headless')).toBeUndefined();
		expect(headlessFromUrl('https://meet.example.edu/room?headless=')).toBeUndefined();
		expect(headlessFromUrl('https://meet.example.edu/room?headless=yes')).toBeUndefined();
		expect(headlessFromUrl(undefined)).toBeUndefined();
		expect(headlessFromUrl('not a url')).toBeUndefined();
	});
});

describe('the preset and its reset', () => {
	const reducer = settingsSlice.reducer;
	const initial = settingsSlice.getInitialState();

	it('applies the recorder layout through the ordinary setters', () => {
		const state = layoutSettingsActions(HEADLESS_PRESET).reduce(reducer, initial);

		expect(state.hideSelfView).toBe(true);
		expect(state.groupAudioOnly).toBe(false);
		expect(state.hideNonVideo).toBe(false);
		expect(state.notificationSounds).toBe(false);
	});

	it('puts the four settings back to their initial values', () => {
		const preset = layoutSettingsActions(HEADLESS_PRESET).reduce(reducer, initial);
		const reset = layoutSettingsActions(initial).reduce(reducer, preset);

		expect(reset.hideSelfView).toBe(initial.hideSelfView);
		expect(reset.groupAudioOnly).toBe(initial.groupAudioOnly);
		expect(reset.hideNonVideo).toBe(initial.hideNonVideo);
		expect(reset.notificationSounds).toBe(initial.notificationSounds);
	});
});

describe('botDisplayName', () => {
	it('takes the name from the URL', () => {
		expect(botDisplayName('Recorder')).toBe('Recorder');
		expect(botDisplayName('  Stream 1 ')).toBe('Stream 1');
	});

	it('falls back to Bot instead of the name stored in the browser', () => {
		expect(botDisplayName(null)).toBe('Bot');
		expect(botDisplayName(undefined)).toBe('Bot');
		expect(botDisplayName('')).toBe('Bot');
		expect(botDisplayName('   ')).toBe('Bot');
	});
});

describe('headlessJoinPlan', () => {
	it('joins when nothing is pending', () => {
		expect(headlessJoinPlan({ joinErrorPending: false })).toEqual({ autoJoin: true });
	});

	it('stays out and names the rejected meeting token', () => {
		expect(headlessJoinPlan({ rejection: 'invalid', joinErrorPending: false })).toEqual({ reason: 'meetingTokenInvalid', autoJoin: false });
		expect(headlessJoinPlan({ rejection: 'required', joinErrorPending: true })).toEqual({ reason: 'meetingTokenRequired', autoJoin: false });
	});

	it('stays out while an earlier join error is still stored', () => {
		expect(headlessJoinPlan({ joinErrorPending: true })).toEqual({ reason: 'joinErrorPending', autoJoin: false });
	});
});
