import { describe, expect, it, vi } from 'vitest';

vi.mock('../utils/edumeetConfig', () => ({ default: { theme: {} } }));

import { spotlightAudioOnlyPeersSelector, spotlightPeersSelector, videoBoxesSelector } from './selectors';
import { RootState } from './store';
import { StateConsumer } from './slices/consumersSlice';
import { Peer } from './slices/peersSlice';

const SESSION = 'main';

type World = {
	peers: string[];
	cameras?: string[];
	screens?: string[];
	spotlights: string[];
	selectedPeers?: string[];
	maxActiveVideos?: number;
	groupAudioOnly?: boolean;
	hideNonVideo?: boolean;
	hideSelfView?: boolean;
	headless?: boolean;
	receiveVideo?: boolean;
};

const consumer = (peerId: string, source: StateConsumer['source']): StateConsumer => ({
	id: `${source}-${peerId}`,
	peerId,
	peerConsumer: true,
	kind: 'video',
	localPaused: false,
	remotePaused: false,
	source,
});

const state = ({
	peers,
	cameras = [],
	screens = [],
	spotlights,
	selectedPeers = [],
	maxActiveVideos = 3,
	groupAudioOnly = true,
	hideNonVideo = false,
	hideSelfView = false,
	headless = false,
	receiveVideo = true,
}: World): RootState => ({
	peers: Object.fromEntries(peers.map((id): [ string, Peer ] => [ id, { id, sessionId: SESSION } ])),
	consumers: [
		...cameras.map((id) => consumer(id, 'webcam')),
		...screens.map((id) => consumer(id, 'screen')),
	],
	roomSessions: {
		[SESSION]: {
			sessionId: SESSION,
			creationTimestamp: 0,
			windowedConsumers: [],
			spotlightConsumers: [],
			selectedPeers,
			spotlights,
			chatHistory: [],
			fileHistory: [],
		},
	},
	me: { sessionId: SESSION, receiveVideo },
	settings: { maxActiveVideos, groupAudioOnly, hideNonVideo, hideSelfView },
	room: { headless },
} as unknown as RootState);

const ids = (peers: { id: string }[]) => peers.map((p) => p.id);

// Slider at 4: me plus three others. Five cameras and three participants
// without video, listed by how recently they spoke.
const crowded = {
	peers: [ 'C1', 'C2', 'C3', 'C4', 'C5', 'A1', 'A2', 'A3' ],
	cameras: [ 'C1', 'C2', 'C3', 'C4', 'C5' ],
};

describe('spotlightPeersSelector with participants without video grouped', () => {
	it('shows cameras first and keeps one slot for the group box', () => {
		const s = state({ ...crowded, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2' ]);
		expect(videoBoxesSelector(s)).toBe(4);
	});

	it('reserves the box for cropped cameras even without audio-only peers', () => {
		const s = state({ peers: crowded.cameras, cameras: crowded.cameras, spotlights: crowded.cameras });

		expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2' ]);
		expect(videoBoxesSelector(s)).toBe(4);
	});

	it('gives every slot to cameras when nobody needs the box', () => {
		const s = state({ peers: [ 'C1', 'C2' ], cameras: [ 'C1', 'C2' ], spotlights: [ 'C1', 'C2' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2' ]);
		expect(videoBoxesSelector(s)).toBe(3);
	});
});

describe('spotlightPeersSelector with participants without video ungrouped', () => {
	const ungrouped = { ...crowded, groupAudioOnly: false };

	it('bounds the tiles by the slider and lets the speaker without video in', () => {
		const s = state({ ...ungrouped, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'A1', 'C1', 'C2' ]);
		expect(ids(spotlightAudioOnlyPeersSelector(s))).toEqual([ 'A1' ]);
		expect(videoBoxesSelector(s)).toBe(4);
	});

	it('gives cropped cameras no avatar tile', () => {
		const s = state({ ...ungrouped, spotlights: [ 'C1', 'C2', 'C3', 'C4', 'C5', 'A1', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2', 'C3' ]);
		expect(spotlightAudioOnlyPeersSelector(s)).toEqual([]);
		expect(videoBoxesSelector(s)).toBe(4);
	});

	it('keeps the visible set when a visible participant starts speaking', () => {
		const before = state({ ...ungrouped, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ] });
		const after = state({ ...ungrouped, spotlights: [ 'C2', 'A1', 'C1', 'C3', 'C4', 'C5', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(after)).toEqual(spotlightPeersSelector(before));
	});

	it('replaces the least recent speaker, camera or not, when an invisible one speaks', () => {
		const s = state({ ...ungrouped, spotlights: [ 'A2', 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A3' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'A1', 'A2', 'C1' ]);
		expect(ids(spotlightAudioOnlyPeersSelector(s))).toEqual([ 'A1', 'A2' ]);
	});

	it('shows everyone when the room fits the slider', () => {
		const s = state({
			peers: [ 'C1', 'A1' ], cameras: [ 'C1' ], spotlights: [ 'C1', 'A1' ], groupAudioOnly: false,
		});

		expect(spotlightPeersSelector(s)).toEqual([ 'A1', 'C1' ]);
		expect(ids(spotlightAudioOnlyPeersSelector(s))).toEqual([ 'A1' ]);
		expect(videoBoxesSelector(s)).toBe(3);
	});

	it('turns cameras into avatar tiles without moving them when video reception is off', () => {
		const s = state({ ...ungrouped, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ], receiveVideo: false });

		expect(spotlightPeersSelector(s)).toEqual([ 'A1', 'C1', 'C2' ]);
		expect(ids(spotlightAudioOnlyPeersSelector(s))).toEqual([ 'C1', 'C2', 'A1' ]);
		expect(videoBoxesSelector(s)).toBe(4);
	});

	it('pins screen sharers and selected peers ahead of the speakers', () => {
		const s = state({
			...ungrouped,
			screens: [ 'C5' ],
			selectedPeers: [ 'A3' ],
			spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ],
		});

		expect(spotlightPeersSelector(s)).toEqual([ 'A1', 'A3', 'C5' ]);
	});
});

describe('spotlightPeersSelector with participants without video hidden', () => {
	it('fills the slots with cameras whatever the group switch says', () => {
		for (const groupAudioOnly of [ true, false ]) {
			const s = state({
				...crowded, hideNonVideo: true, groupAudioOnly, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ],
			});

			expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2', 'C3' ]);
			expect(videoBoxesSelector(s)).toBe(4);
		}
	});
});

describe('spotlightPeersSelector budget', () => {
	it('hands the self view slot to another participant when self view is hidden', () => {
		const grouped = state({ ...crowded, hideSelfView: true, spotlights: [ 'C1', 'C2', 'C3', 'C4', 'C5', 'A1', 'A2', 'A3' ] });
		const ungrouped = state({ ...crowded, hideSelfView: true, groupAudioOnly: false, spotlights: [ 'C1', 'C2', 'C3', 'C4', 'C5', 'A1', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(grouped)).toEqual([ 'C1', 'C2', 'C3' ]);
		expect(videoBoxesSelector(grouped)).toBe(4);
		expect(spotlightPeersSelector(ungrouped)).toEqual([ 'C1', 'C2', 'C3', 'C4' ]);
		expect(videoBoxesSelector(ungrouped)).toBe(4);
	});

	it('keeps the headless view on the grouped ranking without a box', () => {
		const s = state({ ...crowded, headless: true, hideSelfView: true, groupAudioOnly: false, spotlights: [ 'A1', 'C1', 'C2', 'C3', 'C4', 'C5', 'A2', 'A3' ] });

		expect(spotlightPeersSelector(s)).toEqual([ 'C1', 'C2', 'C3', 'C4' ]);
		expect(videoBoxesSelector(s)).toBe(4);
	});
});
