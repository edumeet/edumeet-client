import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { producersActions } from './producersSlice';

export interface MediaState {
	previewAudioDeviceId?: string;
	previewVideoDeviceId?: string;
	liveAudioDeviceId?: string;
	liveVideoDeviceId?: string;
	audioMuted?: boolean;
	videoMuted?: boolean;
	liveBlurBackground: boolean
	previewBlurBackground: boolean
	audioInProgress: boolean;
	videoInProgress: boolean;
	previewWebcamTrackId?: string;
	previewMicTrackId?: string;
	liveWebcamTrackId?: string;
	liveMicTrackId?: string
	deviceUpdateInProgress: boolean
}

const initialState: MediaState = {
	previewAudioDeviceId: undefined,
	previewVideoDeviceId: undefined,
	liveAudioDeviceId: undefined,
	liveVideoDeviceId: undefined,
	audioMuted: true,
	videoMuted: true,
	liveBlurBackground: false,
	previewBlurBackground: false,
	audioInProgress: false,
	videoInProgress: false,
	deviceUpdateInProgress: false
};

const mediaSlice = createSlice({
	name: 'media',
	initialState,
	reducers: {
		setPreviewAudioDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewAudioDeviceId = action.payload;
		}),
		setPreviewVideoDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewVideoDeviceId = action.payload;
		}),
		setPreviewBlurBackground: ((state, action: PayloadAction<boolean>) => {
			state.previewBlurBackground = action.payload;
		}),
		resetPreviewBlurBackground: ((state) => {
			state.previewBlurBackground = state.liveBlurBackground;
		}),
		setPreviewWebcamTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewWebcamTrackId = action.payload;
		}),
		setPreviewMicTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewMicTrackId = action.payload;
		}),
		setLiveAudioDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveAudioDeviceId = action.payload;
		}),
		setLiveVideoDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveVideoDeviceId = action.payload;
		}),
		setLiveWebcamTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveWebcamTrackId = action.payload;
		}),
		setLiveMicTrackId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveMicTrackId = action.payload;
		}),
		setLiveBlurBackground: ((state, action: PayloadAction<boolean>) => {
			state.liveBlurBackground = action.payload;
		}),
		setAudioMuted: ((state, action: PayloadAction<boolean>) => {
			state.audioMuted = action.payload;
		}),
		setVideoMuted: ((state, action: PayloadAction<boolean>) => {
			state.videoMuted = action.payload;
		}),
		setAudioInProgress: ((state, action: PayloadAction<boolean>) => {
			state.audioInProgress = action.payload;
		}),
		setVideoInProgress: ((state, action: PayloadAction<boolean>) => {
			state.videoInProgress = action.payload;
		}),
		setDeviceUpdateInProgress: ((state, action: PayloadAction<boolean>) => {
			state.deviceUpdateInProgress = action.payload;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(producersActions.closeProducer, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = true;
				else if (source === 'webcam')
					state.videoMuted = true;
			})
			.addCase(producersActions.setProducerPaused, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = true;
				else if (source === 'webcam')
					state.videoMuted = true;
			})
			.addCase(producersActions.setProducerResumed, (state, action) => {
				const { local, source } = action.payload;

				if (!local) return;

				if (source === 'mic')
					state.audioMuted = false;
				else if (source === 'webcam')
					state.videoMuted = false;
			});
	}
});

export const mediaActions = mediaSlice.actions;
export default mediaSlice;