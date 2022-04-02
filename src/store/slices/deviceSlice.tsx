import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UpdateWebcamOptions {
	init?: boolean;
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
	newResolution?: string;
	newFrameRate?: number;
}

interface UpdateMicOptions {
	start?: boolean;
	restart?: boolean;
	newDeviceId?: string;
}

interface UpdateScreenSharingOptions {
	start?: boolean;
	newResolution?: string;
	newFrameRate?: number;
}

const deviceSlice = createSlice({
	name: 'device',
	initialState: {},
	reducers: {
		updateWebcam: ((
			// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
			state, action: PayloadAction<UpdateWebcamOptions>
		) => {
			// Dummy action, intercepted in mediaMiddleware
		}),
		updateMic: ((
			// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
			state, action: PayloadAction<UpdateMicOptions>
		) => {
			// Dummy action, intercepted in mediaMiddleware
		}),
		updateScreenSharing: ((
			// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
			state, action: PayloadAction<UpdateScreenSharingOptions>
		) => {
			// Dummy action, intercepted in mediaMiddleware
		})
	},
});

export const deviceActions = deviceSlice.actions;
export default deviceSlice;