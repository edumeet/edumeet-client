import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';
import { Draft } from 'immer';

export type RoomConnectionState = 'new' | 'lobby' | 'joined' | 'left';
export type RoomMode = 'P2P' | 'SFU';
export type VideoCodec = 'vp8' | 'vp9' | 'h264' | 'h265' | 'av1';

interface Drawing {
	history: fabric.Object[]
	historyUndo: fabric.Object[]
	historyRedo: fabric.Object[]
	mode: string,
	size: number,
	colors: string[],
	color: string,
	colorsMenu: string,
	bgColors: string[],
	bgColor: string
}

export interface RoomState {
	headless?: boolean;
	logo?: string;
	backgroundImage?: string;
	joinInProgress?: boolean;
	updateBreakoutInProgress?: boolean;
	transitBreakoutRoomInProgress?: boolean;
	recording?: boolean;
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
	breakoutsEnabled?: boolean;
	chatEnabled?: boolean;
	filesharingEnabled?: boolean;
	raiseHandEnabled?: boolean;
	localRecordingEnabled?: boolean;
	videoCodec?: VideoCodec;
	simulcast?: boolean;
	audioCodec?: string;
	screenSharingCodec?: VideoCodec;
	screenSharingSimulcast?: boolean;
	drawingEnabled?: boolean;
	drawing: Drawing;
}

type RoomUpdate = Omit<RoomState, 'roomMode' | 'state'>;

const colors = [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ];
const bgColors = [ 'lightgray', 'white', 'black' ];

const initialState: RoomState = {
	logo: edumeetConfig.theme.logo,
	backgroundImage: edumeetConfig.theme.backgroundImage,
	roomMode: 'P2P',
	state: 'new',
	recording: false,
	breakoutsEnabled: true,
	chatEnabled: true,
	filesharingEnabled: true,
	raiseHandEnabled: true,
	localRecordingEnabled: true,
	videoCodec: 'vp8',
	simulcast: edumeetConfig.simulcast,
	audioCodec: 'opus',
	screenSharingCodec: 'vp8',
	screenSharingSimulcast: edumeetConfig.simulcastSharing,
	drawingEnabled: true,
	drawing: {
		history: [],
		historyUndo: [],
		historyRedo: [],
		mode: [ 'brush', 'text', 'eraser' ][0],
		size: 5,
		colorsMenu: [ 'Row', 'Menu', 'Menu2' ][0],
		colors: colors,
		color: colors[0],
		bgColors: bgColors,
		bgColor: bgColors[0]
	}

};

const roomSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		updateRoom: ((state, action: PayloadAction<RoomUpdate>) => {
			return { ...state, ...action.payload };
		}),
		setHeadless: ((state, action: PayloadAction<boolean>) => {
			state.headless = action.payload;
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
		setDrawingMode: ((state, action: PayloadAction<string>) => {
			state.drawing.mode = action.payload;
		}),
		setDrawingColorsMenu: ((state, action: PayloadAction<string>) => {
			state.drawing.colorsMenu = action.payload;
		}),
		setDrawingColor: ((state, action: PayloadAction<string>) => {
			state.drawing.color = action.payload;
		}),
		setDrawingHistory: ((state, action: PayloadAction<object[]|[]>) => {
			state.drawing.history = action.payload as Draft<fabric.Object>[];
		}),
		
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;
