import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RoomConnectionState = 'new' | 'lobby' | 'overRoomLimit' | 'joined' | 'kicked' | 'left';
export type SettingsTab = 'media' | 'appearance' | 'advanced';
export type HelpTab = 'shortcuts';
export type RoomMode = 'P2P' | 'SFU';

export interface RoomState {
	id?: string;
	updateBreakoutInProgress?: boolean;
	transitBreakoutRoomInProgress?: boolean;
	lockInProgress?: boolean;
	localeInProgress?: boolean;
	muteAllInProgress?: boolean;
	lobbyPeersPromotionInProgress?: boolean;
	stopAllVideoInProgress?: boolean;
	closeMeetingInProgress?: boolean;
	clearChatInProgress?: boolean;
	clearFileSharingInProgress?: boolean;
	startFileSharingInProgress?: boolean;
	startTranscriptionInProgress?: boolean;
	transcriptionRunning?: boolean;
	state: RoomConnectionState;
	roomMode: RoomMode;
}

type RoomUpdate = Omit<RoomState, 'roomMode' | 'state'>;

const initialState: RoomState = {
	roomMode: 'P2P',
	state: 'new',
};

const roomSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		updateRoom: ((state, action: PayloadAction<RoomUpdate>) => {
			return { ...state, ...action.payload };
		}),
		setMode: ((state, action: PayloadAction<RoomMode>) => {
			state.roomMode = action.payload;
		}),
		setState: ((
			state,
			action: PayloadAction<RoomConnectionState>
		) => {
			state.state = action.payload;
		}),
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;