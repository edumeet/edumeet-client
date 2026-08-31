import { createSelector } from 'reselect';
import { MediaDevice } from '../services/deviceService';
import { Transcript } from '../services/mediaService';
import { Permission, permissions } from '../utils/roles';
import { StateConsumer } from './slices/consumersSlice';
import { LobbyPeer } from './slices/lobbyPeersSlice';
import { Peer } from './slices/peersSlice';
import { RootState } from './store';
import { RoomSession } from './slices/roomSessionsSlice';
import { MeState } from './slices/meSlice';
import edumeetConfig from './../utils/edumeetConfig';
import { DrawingState } from './slices/drawingSlice';
import { DirectMessageThread } from './slices/directMessagesSlice';

// eslint-disable-next-line no-unused-vars
type Selector<S> = (state: RootState) => S;

const meSelector: Selector<MeState> = (state) => state.me;
const drawingSelector: Selector<DrawingState> = (state) => state.drawing;
const mePermissionsSelect: Selector<Permission[]> = (state) => state.permissions.permissions;
const consumersSelect: Selector<StateConsumer[]> = (state) => state.consumers;
const roomSessionsSelect: Selector<Record<string, RoomSession>> = (state) => state.roomSessions;
const peersSelector: Selector<Record<string, Peer>> = (state) => state.peers;
const sessionIdSelector: Selector<string> = (state) => state.me.sessionId;
const lobbyPeersSelector: Selector<LobbyPeer[]> = (state) => state.lobbyPeers;
const maxActiveVideosSelector: Selector<number> = (state) => state.settings.maxActiveVideos;
const showAudioOnlySelector: Selector<boolean> = (state) => state.settings.showAudioOnly;
const hideNonVideoSelector: Selector<boolean> = (state) => state.settings.hideNonVideo;
const hideSelfViewSelector: Selector<boolean> = (state) => state.settings.hideSelfView;
const devicesSelector: Selector<MediaDevice[]> = (state) => state.me.devices;
const headlessSelector: Selector<boolean | undefined> = (state) => state.room.headless;
const receiveVideoSelector: Selector<boolean> = (state) => state.me.receiveVideo;
const recordingSelector: Selector<boolean | undefined> = (state) => state.room.recording;
const directMessagesSelect: Selector<Record<string, DirectMessageThread>> = (state) => state.directMessages;
const unreadMessagesSelect: Selector<number> = (state) => state.ui.unreadMessages;
const activeChatThreadSelect: Selector<string | null> = (state) => state.ui.activeChatThread;

/**
 * Shared empty result for the video consumer selectors. Returning one stable
 * array identity keeps the memoized selectors downstream (and the pause/resume
 * diff in mediaMiddleware) from recomputing on unrelated state changes while
 * video reception is turned off.
 */
const EMPTY_CONSUMERS: StateConsumer[] = [];

export const isMobileSelector: Selector<boolean> = (state) => state.me.browser.platform === 'mobile';

export const isSinkIdSupported = (): boolean => {
	if (!('setSinkId' in HTMLAudioElement.prototype)) return false;

	// Firefox has setSinkId in the prototype but it is broken (bugzilla #1849108).
	// Only trust it on Chromium-based browsers (Chrome, Edge, Opera, etc.).

	return /Chrome\//.test(navigator.userAgent);
};

export const canSelectAudioOutput: Selector<boolean> = () => isSinkIdSupported();

// Whether this browser can do E2EE (WebRTC Encoded Transform). Used to gate the E2EE feature and to
// refuse admission to a room that mandates E2EE. RTCRtpScriptTransform exists in Chrome 110+/
// Firefox 117+/Safari 15.4+, BUT Firefox lays out encoded frames differently from Chromium, so
// cross-browser FF<->Chromium media corrupts (validated 2026-06-24). Until that interop gap is
// solved we restrict E2EE to the Blink engine (Chrome/Edge/Opera/Brave/Vivaldi...; excludes Firefox
// and untested Safari) so E2EE rooms never mix incompatible engines; other browsers are cleanly
// bounced by the capability gate. Browser detection via the shared bowser parser, for consistency.
// Chrome, Edge and Firefox all encrypt and interoperate (verified 2026-08-31), so this is a plain
// capability check. A browser that accepts the transform without ever feeding it is caught at
// runtime instead: the sender holds real media until the worker confirms it is processing frames,
// and the watchdog removes the participant if that never happens.
export const isInsertableStreamsSupported = (): boolean =>
	typeof window !== 'undefined' &&
	'RTCRtpScriptTransform' in window;

/**
 * Returns the peers as an array.
 * 
 * @returns {Peer[]} the peers.
 */
export const peersArraySelector = createSelector(
	peersSelector,
	(peers) => Object.values(peers)
);

/**
 * Returns the number of peers excluding the client.
 * 
 * @returns {number} the number of peers.
 */
export const peersLengthSelector = createSelector(
	peersArraySelector,
	(peers) => peers.length
);

export const roomSessionsArraySelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions)
);

export const roomSessionsLengthSelector = createSelector(
	roomSessionsArraySelector,
	(roomSessions) => roomSessions.length
);

export const p2pModeSelector = createSelector(
	roomSessionsLengthSelector,
	peersLengthSelector,
	(sessions, peers) => sessions === 1 && peers < 2 && edumeetConfig.p2penabled
);

/**
 * Factory function to create a selector that returns the
 * subset of devices that the client has filtered by kind.
 * 
 * @param {string} kind - The kind of devices to return.
 * @returns {Selector<MediaDevice[]>} Selector that returns the subset of devices.
 */
 
export const makeDevicesSelector = (kind: MediaDeviceKind, excludedDeviceId?: string) => {
	return createSelector(
		devicesSelector,
		(devices: MediaDevice[]) => devices.filter((d) => (d.kind === kind) && (d.deviceId !== excludedDeviceId))
	);
};

/**
 * Returns the parent sessionId.
 * 
 * @returns {string | undefined} the parent sessionId.
 */
export const parentRoomSessionIdSelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions).find((roomSession) => roomSession.parent)?.sessionId
);

/**
 * Returns the list of peers that has the same sessionId as me.
 * 
 * @returns {Peer[]} the list of peers.
 */
export const sessionIdPeersSelector = createSelector(
	sessionIdSelector,
	peersArraySelector,
	(sessionId, peers) => peers.filter((p) => p.sessionId === sessionId)
);

/**
 * Returns the list of peers that are in the parent room.
 * 
 * @returns {Peer[]} the list of peers.
 */
export const parentRoomPeersSelector = createSelector(
	parentRoomSessionIdSelector,
	peersArraySelector,
	(parentRoomSessionId, peers) => peers.filter((p) => p.sessionId === parentRoomSessionId)
);

/**
 * Returns the current roomSession that I am in.
 * 
 * @returns {RoomSession} the roomSession.
 */
export const currentRoomSessionSelector = createSelector(
	sessionIdSelector,
	roomSessionsSelect,
	(sessionId, roomSessions) => roomSessions[sessionId]
);

/**
 * Returns the spotlights for the roomSession that I am in.
 * 
 * @returns {string[]} the list of peerIds.
 */
export const sessionIdSpotlightsSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession?.spotlights ?? []
);

export const sessionIdSpotlightedConsumerSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	(roomSession, consumers) => consumers.filter((c) => roomSession?.spotlights?.includes(c.id))
);

const consumerSelectedPeerIdsSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.source === 'screen' || c.source === 'extravideo').map((c) => c.peerId)
);

/**
 * Returns the set of peerIds that currently have at least one live video
 * consumer (webcam, screen or extra video that is not remotely paused).
 * A peer that has turned off its webcam but is still sharing a screen or an
 * extra video is therefore "video capable" and keeps its tile.
 *
 * Webcams stop counting while video reception is turned off. Their consumers
 * still exist and are not remotely paused, so without this a camera we are
 * deliberately not receiving would keep beating an actual screen sharer to a
 * spotlight slot and hand it a tile that renders nothing.
 *
 * @returns {Set<string>} the set of peerIds with live video.
 */
const videoCapablePeerIdsSelector = createSelector(
	consumersSelect,
	receiveVideoSelector,
	(consumers, receiveVideo) => new Set(
		consumers
			.filter((c) =>
				((c.source === 'webcam' && receiveVideo) || c.source === 'screen' || c.source === 'extravideo') &&
				!c.remotePaused
			)
			.map((c) => c.peerId)
	)
);

/**
 * Returns the list of peerIds that are currently selected or spotlighted,
 * cropped to the video-box budget.
 *
 * The budget is derived from maxActiveVideos (the slider, which already
 * reserves a box for the local user). Within it:
 *  - Peers with live video are prioritized over audio-only peers, so a real
 *    camera is never crowded out by an audio-only peer that merely spoke
 *    recently.
 *  - One box is reserved for the collapsed audio-only group when it will be
 *    shown (there is at least one peer without video, or cameras get cropped),
 *    unless "hide participants without video" or headless is on.
 *  - The local user's reserved box is handed back to a camera when self-view
 *    is hidden.
 *
 * @returns {string[]} the list of peerIds.
*/
export const spotlightPeersSelector = createSelector(
	maxActiveVideosSelector,
	currentRoomSessionSelector,
	consumerSelectedPeerIdsSelector,
	videoCapablePeerIdsSelector,
	sessionIdPeersSelector,
	hideNonVideoSelector,
	showAudioOnlySelector,
	hideSelfViewSelector,
	headlessSelector,
	(
		maxActiveVideos,
		roomSession,
		consumerSelectedPeerIds,
		videoCapablePeerIds,
		sessionPeers,
		hideNonVideo,
		showAudioOnly,
		hideSelfView,
		headless,
	) => {
		if (!roomSession) return [];
		const { spotlights, selectedPeers } = roomSession;
		const uniqueSet = Array.from(new Set([ ...consumerSelectedPeerIds, ...selectedPeers, ...spotlights ]));

		// Split candidates into those with live video and those without,
		// preserving the original priority order in each group.
		const videoPeers = uniqueSet.filter((id) => videoCapablePeerIds.has(id));
		const audioPeers = uniqueSet.filter((id) => !videoCapablePeerIds.has(id));

		// Self-view occupies one of the slider's boxes; reclaim it when hidden.
		const budget = maxActiveVideos + (hideSelfView ? 1 : 0);

		// The collapsed audio-only box appears when non-video peers are not
		// hidden and at least one peer will end up in it: either a peer with no
		// live video at all, or a camera that gets cropped because there are
		// more cameras than the budget allows. With showAudioOnly the peers get
		// a tile each instead of the collapsed box, and those tiles are rendered
		// outside this budget, so nothing is reserved for them.
		const audioBoxShown =
			!hideNonVideo &&
			!showAudioOnly &&
			!headless &&
			(
				sessionPeers.some((p) => !videoCapablePeerIds.has(p.id)) ||
				videoPeers.length > budget
			);

		const videoSlots = Math.max(0, budget - (audioBoxShown ? 1 : 0));

		return [ ...videoPeers, ...audioPeers ]
			.slice(0, videoSlots)
			.sort((a, b) => String(a).localeCompare(String(b)));
	}
);

/**
 * Returns the active speaker for the roomSession that I am in.
 * 
 * @returns {string | undefined} the peerId.
 */
export const activeSpeakerIdSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.activeSpeakerId
);

/**
 * Returns the list of rooms that are not parent rooms.
 * 
 * @returns {RoomSession[]} the list of rooms.
 */
export const breakoutRoomsSelector = createSelector(
	roomSessionsSelect,
	(roomSessions) => Object.values(roomSessions).filter((roomSession) => !roomSession.parent)
);

/**
 * Returns the list of mic state consumers of all peers.
 * 
 * @returns {StateConsumer[]} the list of mic state consumers.
 */
export const micConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.source === 'mic')
);

/**
 * Returns the list of webcam state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * Empty while video reception is turned off. That is the whole mechanism
 * behind the feature: mediaMiddleware diffs resumedVideoConsumersSelector,
 * sees every webcam drop out and pauses them on the server, so they stop
 * costing downstream bandwidth.
 * 
 * @returns {StateConsumer[]} the list of webcam state consumers.
 * @see spotlightPeersSelector
 * @see resumedVideoConsumersSelector
 */
export const spotlightWebcamConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	receiveVideoSelector,
	(spotlights, consumers, receiveVideo) => {
		if (!receiveVideo) return EMPTY_CONSUMERS;

		return consumers.filter(
			(c) => c.source === 'webcam' && !c.remotePaused && spotlights.includes(c.peerId)
		);
	}
);

/**
 * Returns the list of screen state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * @returns {StateConsumer[]} the list of screen state consumers.
 * @see spotlightPeersSelector
 */
export const spotlightScreenConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) => consumers.filter(
		(c) => c.source === 'screen' && !c.remotePaused && spotlights.includes(c.peerId)
	)
);

/**
 * Returns the list of extra video state consumers of the peers that are
 * currently selected or spotlighted.
 * 
 * @returns {StateConsumer[]} the list of extra video state consumers.
 * @see spotlightPeersSelector
 */
export const spotlightExtraVideoConsumerSelector = createSelector(
	spotlightPeersSelector,
	consumersSelect,
	(spotlights, consumers) => consumers.filter(
		(c) => c.source === 'extravideo' && !c.remotePaused && spotlights.includes(c.peerId)
	)
);

/**
 * Returns the list of all peerIds sorted by:
 * 1. Raised hand (and time they raised it)
 * 2. Spotlight and selected
 * 3. All the rest
 * 
 * @returns {string[]} the list of peerIds.
 * @see spotlightPeersSelector
 */
export const parentParticipantListSelector = createSelector(
	[ parentRoomPeersSelector, sessionIdSpotlightsSelector ],
	(peers, spotlights) => {
		const raisedHandSortedPeers =
			peers.filter((peer) => peer.raisedHand)
				.sort((a, b) => 
					(a.raisedHandTimestamp || 0) -
					(b.raisedHandTimestamp || 0)
				);
		const spotlightSortedPeers =
			peers.filter((peer) => spotlights.includes(peer.id) && !peer.raisedHand)
				.sort((a, b) => String(a.displayName || '')
					.localeCompare(String(b.displayName || ''))
				);
		const peersSorted =
			peers.filter((peer) => !spotlights.includes(peer.id) && !peer.raisedHand)
				.sort((a, b) => String(a.displayName || '')
					.localeCompare(String(b.displayName || ''))
				);

		return [ ...raisedHandSortedPeers, ...spotlightSortedPeers, ...peersSorted ];
	}
);

/** Returns true if I am in parent session.
 * 
 * @returns {boolean} true if I am in parent session.
 */
export const inParentRoomSelector = createSelector(
	sessionIdSelector,
	roomSessionsSelect,
	(sessionId, roomSessions) => Object.values(roomSessions).find((rs) => rs.sessionId === sessionId)?.parent
);

/**
 * Returns the number of shared files.
 * 
 * @returns {number} the number of shared files.
 */
export const filesLengthSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.fileHistory.length
);

/**
 * Returns the list of shared files.
 * 
 * @returns {File[]} the list of shared files.
 */
export const filesSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.fileHistory
);

/**
 * Returns the chat messages of the current roomSession I am in.
 * 
 * @returns {ChatMessage[]} the chat messages.
 */
export const chatMessagesSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.chatHistory
);

const lastActivity = (thread: DirectMessageThread): number =>
	thread.messages[thread.messages.length - 1]?.timestamp ?? Number.MAX_SAFE_INTEGER;

/**
 * Returns the visible private chat threads, most recently active first.
 * 
 * @returns {DirectMessageThread[]} the threads.
 */
export const directMessageThreadsSelector = createSelector(
	directMessagesSelect,
	(threads) => Object.values(threads)
		.filter((thread) => !thread.hidden)
		.sort((a, b) => lastActivity(b) - lastActivity(a))
);

/**
 * Returns the private chat thread that is currently open, if any.
 * 
 * @returns {DirectMessageThread | undefined} the thread.
 */
export const activeDirectMessageThreadSelector = createSelector(
	directMessagesSelect,
	activeChatThreadSelect,
	(threads, activeThread) => (activeThread ? threads[activeThread] : undefined)
);

/**
 * Returns the number of unread messages in the room chat and all private chats.
 * 
 * @returns {number} the number of unread messages.
 */
export const totalUnreadMessagesSelector = createSelector(
	unreadMessagesSelect,
	directMessagesSelect,
	(unreadMessages, threads) => Object.values(threads)
		.reduce((unread, thread) => unread + thread.unread, unreadMessages)
);

/**
 * Returns the creationTimestamp of the roomSession I am in.
 * 
 * @returns {number} the creationTimestamp.
 */
export const roomSessionCreationTimestampSelector = createSelector(
	currentRoomSessionSelector,
	(roomSession) => roomSession.creationTimestamp
);

/**
 * Returns the number of peers in the lobby.
 * 
 * @returns {number} the number of peers in the lobby.
 */
export const lobbyPeersLengthSelector = createSelector(
	lobbyPeersSelector,
	(peers) => peers.length
);

/**
 * Returns the number of peers that have raised their hand.
 * 
 * @returns {number} the number of peers that have raised their hand.
 */
export const raisedHandsSelector = createSelector(
	peersArraySelector,
	(peers) => peers.reduce((a, b) => (a + (b.raisedHand ? 1 : 0)), 0)
);

export const someoneIsRecordingSelector = createSelector(
	sessionIdPeersSelector,
	recordingSelector,
	(peers, recording) => recording || peers.some((peer) => peer.recording)
);

/**
 * Returns the one state consumer that is currently in fullscreen
 * in the main window.
 * 
 * @returns {StateConsumer | undefined} the state consumer.
 */
export const fullscreenConsumerSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	receiveVideoSelector,
	(roomSession, consumers, receiveVideo) => consumers.find(
		(c) => c.id === roomSession.fullscreenConsumer && (receiveVideo || c.source !== 'webcam')
	)
);

/**
 * Returns the list of state consumers that are currently in a
 * separate window.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 */
export const windowedConsumersSelector = createSelector(
	currentRoomSessionSelector,
	consumersSelect,
	receiveVideoSelector,
	(roomSession, consumers, receiveVideo) => consumers.filter(
		(c) => roomSession.windowedConsumers.includes(c.id) && (receiveVideo || c.source !== 'webcam')
	)
);

/**
 * Returns the list of audio state consumers of all peers.
 * 
 * @returns {StateConsumer[]} the list of audio state consumers.
 */
export const audioConsumerSelector = createSelector(
	consumersSelect,
	(consumers) => consumers.filter((c) => c.kind === 'audio')
);

/**
 * Returns the state consumers of all the visible video tiles.
 * This is the list of screen, webcam and extra video tiles, consumers only.
 * 
 * mediaMiddleware diffs this list on every action that can change it and
 * pauses/resumes the corresponding consumers on the server, so anything not in
 * here costs no downstream bandwidth. Webcams drop out of it entirely while
 * video reception is turned off.
 * 
 * @returns {StateConsumer[]} the list of state consumers.
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const resumedVideoConsumersSelector = createSelector(
	spotlightWebcamConsumerSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	fullscreenConsumerSelector,
	windowedConsumersSelector,
	(
		webcamConsumers,
		screenConsumers,
		extraVideoConsumers,
		fullscreenedConsumer,
		newWindowedConsumers
	) => {
		let consumers: StateConsumer[];

		// If we have a fullscreen consumer, all other consumers are
		// invisible except for a possible windowed consumer.
		if (fullscreenedConsumer)
			consumers = [ fullscreenedConsumer ];
		else {
			consumers = [
				...webcamConsumers,
				...screenConsumers,
				...extraVideoConsumers
			];
		}

		consumers.push(...newWindowedConsumers);

		return consumers;
	}
);

export const selectedVideoConsumersSelector = createSelector(
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(screenConsumers, extraVideoConsumers) => ([
		...screenConsumers,
		...extraVideoConsumers,
	])
);

/**
 * Returns the list of peers without a webcam consumer.
 * 
 * @returns {Peer[]} the list of peerIds.
 */
export const audioOnlySessionPeersSelector = createSelector(
	sessionIdPeersSelector,
	resumedVideoConsumersSelector,
	(peers, consumers) => peers.filter((peer) => !consumers.some((c) => c.peerId === peer.id))
);

/** Returns true if the current active speaker is an audio only peer.
 * 
 * @returns {boolean} true if the current speaker is an audio only peer.
 */
export const activeSpeakerIsAudioOnlySelector = createSelector(
	audioOnlySessionPeersSelector,
	activeSpeakerIdSelector,
	(audioOnlyPeers, activeSpeakerId) => audioOnlyPeers.some((peer) => peer.id === activeSpeakerId)
);

/**
 * Returns the number of visible video tiles in the Democratic view.
 * This is the sum of screen, webcam and extra video tiles, both producers
 * and consumers.
 * 
 * @returns {number} the number of visible video tiles.
 * @see screenProducerSelector
 * @see extraVideoProducerSelector
 * @see spotlightPeersSelector
 * @see spotlightWebcamConsumerSelector
 * @see spotlightScreenConsumerSelector
 * @see spotlightExtraVideoConsumerSelector
 * @see Democratic.tsx
 */
export const videoBoxesSelector = createSelector(
	hideSelfViewSelector,
	spotlightWebcamConsumerSelector,
	audioOnlySessionPeersSelector,
	showAudioOnlySelector,
	hideNonVideoSelector,
	headlessSelector,
	(
		hideSelfView,
		webcamConsumers,
		audioOnlyPeers,
		showAudioOnly,
		hideNonVideo,
		headless,
	) => {
		let videoBoxes = hideSelfView ? 0 : 1; // Maybe add a box for Me view

		// Add everyone else's video
		videoBoxes += webcamConsumers.length;

		if (audioOnlyPeers.length > 0 && !hideNonVideo && !headless && !showAudioOnly) {
			videoBoxes++; // Add the audio only box
		} else if (audioOnlyPeers.length > 0 && !hideNonVideo && !headless && showAudioOnly) {
			videoBoxes+=audioOnlyPeers.length;
		}

		return videoBoxes;
	});

export const selectedVideoBoxesSelector = createSelector(
	meSelector,
	drawingSelector,
	spotlightScreenConsumerSelector,
	spotlightExtraVideoConsumerSelector,
	(
		{ screenEnabled, extraVideoEnabled },
		{ drawingEnabled },
		screenConsumers,
		extraVideoConsumers,
	) => {
		let videoBoxes = 0;

		// Add our own screen share, if it exists
		if (screenEnabled) videoBoxes++;
		if (extraVideoEnabled) videoBoxes++;
		if (drawingEnabled) videoBoxes++;
		
		// Add everyone else's video
		videoBoxes += screenConsumers.length + extraVideoConsumers.length;

		return videoBoxes;
	});

/**
 * Factory function that returns a selector that returns a peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<Peer | undefined>} Selector for the peer.
 */
export const makePeerSelector = (id: string): Selector<Peer | undefined> => {
	return createSelector(peersSelector, (peers) => peers[id]);
};

/**
 * Factory function that returns a selector that returns the list of peers that are in a sessionId.
 * 
 * @param {string} sessionId - The sessionId.
 * @returns {Selector<Peer[]>} Selector for the peers.
 */
export const makePeersInSessionSelector = (sessionId: string): Selector<Peer[]> => {
	return createSelector(peersArraySelector, (peers) => peers.filter((p) => p.sessionId === sessionId));
};

/**
 * Factory function that returns a selector that returns the array of
 * transcripts for a given peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<PeerTranscript[]>} Selector for the transcripts.
 */
export const makePeerTranscriptsSelector = (id: string): Selector<Transcript[]> => {
	return createSelector(peersSelector, (peers) => peers[id]?.transcripts ?? []);
};

/**
 * Factory function that returns a selector that returns the set of
 * mic/webcam/screen/extravideo consumers for a given peer.
 * 
 * @param {string} id - The peer ID.
 * @returns {Selector<{
 * 	micConsumer: StateConsumer | undefined,
 * 	webcamConsumer: StateConsumer | undefined,
 * 	screenConsumer: StateConsumer | undefined,
 * 	extraVideoConsumers: StateConsumer[]
 * }>} Selector for the peer's consumers.
 */
export const makePeerConsumerSelector = (id: string): Selector<{
	micConsumer: StateConsumer | undefined;
	webcamConsumer: StateConsumer | undefined;
	screenConsumer: StateConsumer | undefined;
	extraVideoConsumers: StateConsumer[];
}> => {
	return createSelector(
		consumersSelect,
		(consumers: StateConsumer[]) => {
			const micConsumer = consumers.find((c) => c.peerId === id && c.source === 'mic' && !c.remotePaused);
			const webcamConsumer = consumers.find((c) => c.peerId === id && c.source === 'webcam' && !c.remotePaused);
			const screenConsumer = consumers.find((c) => c.peerId === id && c.source === 'screen' && !c.remotePaused);
			const extraVideoConsumers = consumers.filter((c) => c.peerId === id && c.source === 'extravideo' && !c.remotePaused);

			return { micConsumer, webcamConsumer, screenConsumer, extraVideoConsumers };
		}
	);
};

export interface PeerConsumers {
	micConsumer?: StateConsumer;
	webcamConsumer?: StateConsumer;
	screenConsumer?: StateConsumer;
	extraVideoConsumers: StateConsumer[];
}

/**
 * Factory function that returns a selector that returns true if the
 * id matches active speaker in session.
 * 
 * @param {string} id - The permission.
 * @returns {boolean} true if id matches the active speaker.
 */
export const makeIsActiveSpeakerSelector = (id: string): Selector<boolean> => {
	return createSelector(
		sessionIdSelector,
		roomSessionsSelect,
		(sessionId, roomSessions) => {
			return roomSessions[sessionId]?.activeSpeakerId === id;
		}
	);
};

export const makePermissionSelector = (permission: Permission): Selector<boolean> => createSelector(mePermissionsSelect, (p) => p.includes(permission));

// Permissions that are checked outside React, where the usePermissionSelector
// hook is not available (thunks, event listeners). Built once at module level so
// the memoization is shared rather than rebuilt on every call.
export const audioPermissionSelector = makePermissionSelector(permissions.SHARE_AUDIO);
export const videoPermissionSelector = makePermissionSelector(permissions.SHARE_VIDEO);
export const screenPermissionSelector = makePermissionSelector(permissions.SHARE_SCREEN);
export const extraVideoPermissionSelector = makePermissionSelector(permissions.SHARE_EXTRA_VIDEO);
export const lockPermissionSelector = makePermissionSelector(permissions.CHANGE_ROOM_LOCK);
