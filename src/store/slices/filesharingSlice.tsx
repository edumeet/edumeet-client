import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilesharingFile } from '../../utils/types';

type FilesharingState = FilesharingFile[];

const initialState: FilesharingState = [];

const filesharingSlice = createSlice({
	name: 'filesharing',
	initialState,
	reducers: {
		addFile: ((state, action: PayloadAction<FilesharingFile>) => {
			state.push(action.payload);
		}),
		addFiles: ((state, action: PayloadAction<FilesharingFile[]>) => {
			return [ ...state, ...action.payload ];
		}),
		clearFiles: (() => {
			return [];
		}),
	}
});

export const filesharingActions = filesharingSlice.actions;
export default filesharingSlice;