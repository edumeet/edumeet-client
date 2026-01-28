import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import { ThumbnailItem } from '../../services/clientImageService';
import { LocalCapabilities, MediaCapabilities } from '../../services/mediaService';
import { deviceInfo, DeviceInfo } from '../../utils/deviceInfo';
import edumeetConfig from '../../utils/edumeetConfig';
import { roomActions } from './roomSlice';
import { BackgroundConfig, BackgroundType } from '../../utils/types';

export interface MeState {
	id: string;
	selectedDestop: {
		imageName: string,
		imageUrl: string
	} | null,
	thumbnailList: ThumbnailItem[];
	sessionId: string;
	browser: Omit<DeviceInfo, 'bowser'>;
	previewWebcamTrackId?: string;
	previewMicTrackId?: string;
	picture?: string;
	canSendMic: boolean;
	canSendWebcam: boolean;
	canShareScreen: boolean;
	canRecord: boolean;
	canTranscribe: boolean;
	canShareFiles: boolean;
	devices: MediaDeviceInfo[];
	raisedHand: boolean;
	sendReaction: string | null;
	escapeMeeting: boolean;
	audioMuted: boolean;
	videoMuted: boolean;
	lostAudio: boolean;
	lostVideo: boolean;
	webGLSupport: boolean;
	// Status flags
	audioInProgress: boolean;
	videoInProgress: boolean;
	screenSharingInProgress: boolean;
	displayNameInProgress: boolean;
	raisedHandInProgress: boolean;
	sendReactionInProgress: boolean;
	escapeMeetingInProgress: boolean;
	micEnabled: boolean;
	webcamEnabled: boolean;
	screenEnabled: boolean;
	screenAudioEnabled: boolean;
	extraVideoEnabled: boolean;
	extraVideoTrackId?: string;
	extraAudioEnabled: boolean;
	videoBackgroundEffect: BackgroundConfig | null;
	reconnectKey: string | undefined;
}

const initialState: MeState = {
	id: uuid(),
	selectedDestop: null,
	thumbnailList: [],
	sessionId: 'temp',
	browser: deviceInfo(),
	canSendMic: true,
	canSendWebcam: true,
	canShareScreen: true,
	canShareFiles: false,
	canRecord: false,
	canTranscribe: false,
	devices: [],
	raisedHand: false,
	sendReaction: null,
	escapeMeeting: false,
	audioMuted: edumeetConfig.askForMediaOnJoin ? false : true,
	videoMuted: edumeetConfig.askForMediaOnJoin ? false : true,
	lostAudio: false,
	lostVideo: false,
	webGLSupport: false,
	// Status flags
	audioInProgress: false,
	videoInProgress: false,
	screenSharingInProgress: false,
	displayNameInProgress: false,
	raisedHandInProgress: false,
	sendReactionInProgress: false,
	escapeMeetingInProgress: false,
	micEnabled: false,
	webcamEnabled: false,
	screenEnabled: false,
	screenAudioEnabled: false,
	extraVideoEnabled: false,
	extraVideoTrackId: undefined,
	extraAudioEnabled: false,
	videoBackgroundEffect: null,
	reconnectKey: undefined,
};

const meSlice = createSlice({
	name: 'me',
	initialState,
	reducers: {
		resetMe: ((state) => {
			return { ...initialState, id: uuid(), browser: state.browser, devices: state.devices };
		}),
		setMe: ((state, action: PayloadAction<string>) => {
			state.id = action.payload;
		}),
		setSelectedDestop: ((state, action: PayloadAction<{ imageName: string, imageUrl: string } | null>) => {
			state.selectedDestop = action.payload;
		}),
		setThumbnailList: ((state, action: PayloadAction<ThumbnailItem[]>) => {
			state.thumbnailList = [ ...action.payload ];
		}),
		addThumbnail: ((state, action: PayloadAction<ThumbnailItem>) => {
			state.thumbnailList = [ ...state.thumbnailList, action.payload ];
		}),
		setPreviewWebcamTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewWebcamTrackId = action.payload;
		}),
		setPreviewMicTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewMicTrackId = action.payload;
		}),
		setSessionId: ((state, action: PayloadAction<string>) => {
			state.sessionId = action.payload;
		}),
		setPicture: ((state, action: PayloadAction<string>) => {
			state.picture = action.payload;
		}),
		setMediaCapabilities: ((
			state,
			action: PayloadAction<MediaCapabilities>
		) => {
			return { ...state, ...action.payload };
		}),
		setLocalCapabilities: ((
			state,
			action: PayloadAction<LocalCapabilities>
		) => {
			return { ...state, ...action.payload };
		}),
		setDevices: ((state, action: PayloadAction<MediaDeviceInfo[]>) => {
			state.devices = action.payload;
		}),
		setRaisedHand: ((state, action: PayloadAction<boolean>) => {
			state.raisedHand = action.payload;
		}),
		setSendReaction: ((state, action: PayloadAction<string|null>) => {
			state.sendReaction = action.payload;
		}),
		setEscapeMeeting: ((state, action: PayloadAction<boolean>) => {
			state.escapeMeeting = action.payload;
		}),
		setAudioMuted: ((state, action: PayloadAction<boolean>) => {
			state.audioMuted = action.payload;
		}),
		setVideoMuted: ((state, action: PayloadAction<boolean>) => {
			state.videoMuted = action.payload;
		}),
		setLostAudio: ((state, action: PayloadAction<boolean>) => {
			state.lostAudio = action.payload;
		}),
		setLostVideo: ((state, action: PayloadAction<boolean>) => {
			state.lostVideo = action.payload;
		}),
		setWebGLSupport: ((state, action: PayloadAction<boolean>) => {
			state.webGLSupport = action.payload;
		}),
		// Status flags
		setAudioInProgress: ((state, action: PayloadAction<boolean>) => {
			state.audioInProgress = action.payload;
		}),
		setVideoInProgress: ((state, action: PayloadAction<boolean>) => {
			state.videoInProgress = action.payload;
		}),
		setScreenSharingInProgress: ((state, action: PayloadAction<boolean>) => {
			state.screenSharingInProgress = action.payload;
		}),
		setRaiseHandInProgress: ((state, action: PayloadAction<boolean>) => {
			state.raisedHandInProgress = action.payload;
		}),
		setSendReactionInProgress: ((state, action: PayloadAction<boolean>) => {
			state.sendReactionInProgress = action.payload;
		}),
		setEscapeMeetingInProgress: ((state, action: PayloadAction<boolean>) => {
			state.escapeMeetingInProgress = action.payload;
		}),
		setDispayNameInProgress: ((state, action: PayloadAction<boolean>) => {
			state.displayNameInProgress = action.payload;
		}),
		setMicEnabled: ((state, action: PayloadAction<boolean>) => {
			state.micEnabled = action.payload;
		}),
		setWebcamEnabled: ((state, action: PayloadAction<boolean>) => {
			state.webcamEnabled = action.payload;
		}),
		setScreenEnabled: ((state, action: PayloadAction<boolean>) => {
			state.screenEnabled = action.payload;
		}),
		setScreenAudioEnabled: ((state, action: PayloadAction<boolean>) => {
			state.screenAudioEnabled = action.payload;
		}),
		setExtraVideoEnabled: ((state, action: PayloadAction<boolean>) => {
			state.extraVideoEnabled = action.payload;
		}),
		setExtraVideoTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.extraVideoTrackId = action.payload;
		}),
		setExtraAudioEnabled: ((state, action: PayloadAction<boolean>) => {
			state.extraAudioEnabled = action.payload;
		}),
		setVideoBackgroundEffect: ((state, action: PayloadAction<BackgroundConfig | null>) => {
			state.videoBackgroundEffect = action.payload;
		}),
		setVideoBackgroundEffectDisabled: ((state) => {
			state.videoBackgroundEffect = {
				type: BackgroundType.NONE
			};
		}),
		setReconnectKey: ((state, action: PayloadAction<string | undefined>) => {
			state.reconnectKey = action.payload;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (state, action) => {
				if (action.payload === 'left')
					return { ...initialState, id: uuid(), browser: state.browser, devices: state.devices };
			});
	}
});

export const meActions = meSlice.actions;
export default meSlice;
