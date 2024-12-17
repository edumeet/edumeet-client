import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ManagementState {
	username: string;
}

const initialState: ManagementState = {
	username: '',
};

const managementSlice = createSlice({
	name: 'management',
	initialState,
	reducers: {
		setUsername: ((state, action: PayloadAction<string>) => {
			state.username = action.payload ?? '';
		}),
	},
});

export const managamentActions = managementSlice.actions;
export default managementSlice;
