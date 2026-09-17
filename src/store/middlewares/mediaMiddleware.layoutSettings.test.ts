import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/edumeetConfig', () => ({ default: { theme: {}, groupAudioOnly: true, hideNonVideo: false, hideSelfView: false, browserWarnings: [] } }));
vi.mock('../../utils/deviceInfo', () => ({ deviceInfo: () => ({ name: 'test', version: '1', platform: 'test' }), browserInfo: { satisfies: () => false } }));
vi.mock('../store', () => ({}));
vi.mock('../actions/mediaActions', () => ({ updateMic: vi.fn(), updateWebcam: vi.fn() }));
vi.mock('../../components/translated/translatedComponents', () => ({ lostMediaServerLabel: () => '', noMediaServerLabel: () => '' }));

import createMediaMiddleware from './mediaMiddleware';
import settingsSlice, { settingsActions } from '../slices/settingsSlice';
import { consumersActions, StateConsumer } from '../slices/consumersSlice';
import { RootState } from '../store';

type MiddlewareInput = Parameters<typeof createMediaMiddleware>[0];
type ApiInput = Parameters<ReturnType<typeof createMediaMiddleware>>[0];

const SESSION = 'main';

const webcam = (peerId: string): StateConsumer => ({
	id: `webcam-${peerId}`,
	peerId,
	peerConsumer: true,
	kind: 'video',
	localPaused: false,
	remotePaused: false,
	source: 'webcam',
});

// Slider at 4 with five cameras and three participants without video, nobody
// has spoken yet so the list is in join order.
const cameras = [ 'C1', 'C2', 'C3', 'C4', 'C5' ];
const others = [ 'A1', 'A2', 'A3' ];

const setup = () => {
	let state = {
		peers: Object.fromEntries([ ...cameras, ...others ].map((id) => [ id, { id, sessionId: SESSION } ])),
		consumers: cameras.map(webcam),
		roomSessions: {
			[SESSION]: {
				sessionId: SESSION,
				creationTimestamp: 0,
				windowedConsumers: [],
				spotlightConsumers: [],
				selectedPeers: [],
				spotlights: [ ...cameras, ...others ],
				chatHistory: [],
				fileHistory: [],
			},
		},
		me: { sessionId: SESSION, receiveVideo: true },
		settings: { ...settingsSlice.getInitialState(), maxActiveVideos: 3 },
		room: {},
	} as unknown as RootState;

	const dispatch = vi.fn();
	const mediaService = { init: vi.fn(), close: vi.fn(), removeAllListeners: vi.fn(), changeConsumer: vi.fn() };
	const middleware = createMediaMiddleware({ mediaService } as unknown as MiddlewareInput);
	const next = vi.fn((action) => {
		state = { ...state, settings: settingsSlice.reducer(state.settings, action) };
	});
	const invoke = middleware({ dispatch, getState: () => state } as unknown as ApiInput)(next);

	return { dispatch, next, invoke, getState: () => state };
};

describe('mediaMiddleware on the layout switches', () => {
	it('starts grouped, as the config says', () => {
		expect(setup().getState().settings.groupAudioOnly).toBe(true);
	});

	it('resumes the camera that gains a tile when the participants without video are ungrouped', () => {
		const { dispatch, next, invoke, getState } = setup();

		invoke(settingsActions.setGroupAudioOnly(false));

		expect(next).toHaveBeenCalledWith(settingsActions.setGroupAudioOnly(false));
		expect(getState().settings.groupAudioOnly).toBe(false);
		expect(dispatch).toHaveBeenCalledWith(consumersActions.setConsumerResumed({ consumerId: 'webcam-C3', local: true }));
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('pauses that camera again when they are grouped', () => {
		const { dispatch, invoke } = setup();

		invoke(settingsActions.setGroupAudioOnly(false));
		dispatch.mockClear();
		invoke(settingsActions.setGroupAudioOnly(true));

		expect(dispatch).toHaveBeenCalledWith(consumersActions.setConsumerPaused({ consumerId: 'webcam-C3', local: true }));
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('hands the group box slot to a camera when participants without video are hidden', () => {
		const { dispatch, invoke } = setup();

		invoke(settingsActions.setHideNonVideo(true));

		expect(dispatch).toHaveBeenCalledWith(consumersActions.setConsumerResumed({ consumerId: 'webcam-C3', local: true }));
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('hands the self view slot to a camera when self view is hidden', () => {
		const { dispatch, invoke } = setup();

		invoke(settingsActions.setHideSelfView(true));

		expect(dispatch).toHaveBeenCalledWith(consumersActions.setConsumerResumed({ consumerId: 'webcam-C3', local: true }));
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('leaves the consumers alone for a setting that does not move tiles', () => {
		const { dispatch, next, invoke } = setup();

		invoke(settingsActions.updateSettings({ mirroredSelfView: false }));

		expect(next).toHaveBeenCalledTimes(1);
		expect(dispatch).not.toHaveBeenCalled();
	});
});
