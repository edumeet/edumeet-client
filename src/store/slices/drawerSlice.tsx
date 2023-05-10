import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomSessionsActions } from './roomSessionsSlice';

export type ToolAreaTab = 'chat' | 'users';

export interface DrawerState {
	open: boolean;
	tab: ToolAreaTab;
	unreadMessages: number;
	unreadFiles: number;
}

const initialState: DrawerState = {
	open: false,
	tab: 'chat',
	unreadMessages: 0,
	unreadFiles: 0
};

const drawerSlice = createSlice({
	name: 'drawer',
	initialState,
	reducers: {
		toggle: ((state) => {
			state.open = !state.open;
			if (state.open && state.tab === 'chat') {
				state.unreadMessages = 0;
				state.unreadFiles = 0;
			}
		}),
		setTab: ((state, action: PayloadAction<ToolAreaTab>) => {
			state.tab = action.payload;
		}),
		addFile: ((state) => {
			if (state.open && state.tab === 'chat')
				return;

			state.unreadFiles += 1;
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomSessionsActions.addMessage, (state) => {
				if (state.open && state.tab === 'chat')
					return;
	
				state.unreadMessages += 1;
			});
	}
});

export const drawerActions = drawerSlice.actions;
export default drawerSlice;