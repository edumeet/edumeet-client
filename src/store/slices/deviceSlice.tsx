import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DeviceState {
	keyListener?: boolean;
	mediaDeviceListener?: boolean;
}

const initialState: DeviceState = {
	keyListener: false,
	mediaDeviceListener: false,
};

const deviceSlice = createSlice({
	name: 'device',
	initialState,
	reducers: {
		setKeyListener: ((
			state,
			action: PayloadAction<{ keyListener: boolean }>
		) => {
			state.keyListener = action.payload.keyListener;
		}),
		setMediaDeviceListener: ((
			state,
			action: PayloadAction<{ mediaDeviceListener: boolean }>
		) => {
			state.mediaDeviceListener = action.payload.mediaDeviceListener;
		}),
	},
});

export const deviceActions = deviceSlice.actions;
export default deviceSlice;