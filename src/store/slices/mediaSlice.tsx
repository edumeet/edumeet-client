import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { producersActions } from './producersSlice';

export interface MediaState {
	previewAudioInputDeviceId?: string;
	previewAudioOutputDeviceId?: string
	previewVideoDeviceId?: string;
	previewWebcamTrackId?: string;
	previewMicTrackId?: string;
	previewBlurBackground: boolean
	liveAudioInputDeviceId?: string;
	liveAudioOutputDeviceId?: string;
	liveVideoDeviceId?: string;
	liveWebcamTrackId?: string;
	liveMicTrackId?: string
	liveBlurBackground: boolean
	audioMuted?: boolean;
	videoMuted?: boolean;
	audioInProgress: boolean;
	videoInProgress: boolean;
}

const initialState: MediaState = {
	audioMuted: true,
	videoMuted: true,
	liveBlurBackground: false,
	previewBlurBackground: false,
	audioInProgress: false,
	videoInProgress: false,
};

const mediaSlice = createSlice({
	name: 'media',
	initialState,
	reducers: {
		setPreviewAudioInputDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewAudioInputDeviceId = action.payload;
		}),
		setPreviewAudioOutputDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.previewAudioOutputDeviceId = action.payload;
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
		setLiveAudioInputDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveAudioInputDeviceId = action.payload;
		}),
		setLiveAudioOutputDeviceId: ((state, action: PayloadAction<string | undefined>) => {
			state.liveAudioOutputDeviceId = action.payload;
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
		testAudioOutput: () => {
			// handle in middleWare
		}
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