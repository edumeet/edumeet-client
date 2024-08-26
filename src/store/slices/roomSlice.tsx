import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export type RoomConnectionState = 'new' | 'lobby' | 'joined' | 'left';
export type RoomMode = 'P2P' | 'SFU';
export type VideoCodec = 'vp8' | 'vp9' | 'h264' | 'h265' | 'av1';

export interface Drawing {
	history: string
	historyUndo: fabric.Object[]
	historyRedo: fabric.Object[]
	mode: string,
	size: number,
	eraserSize: number,
	zoom: number,
	colorsMenu: string,
	colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
	color: Drawing['colors'][number],
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
		history: '',
		historyUndo: [],
		historyRedo: [],
		mode: [ 'brush', 'text', 'eraser' ][0],
		size: 20,
		eraserSize: 60,
		zoom: 1,
		colorsMenu: [ 'Row', 'Menu', 'Menu2' ][0],
		colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
		color: 'red',
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
		setDrawingHistory: ((state, action: PayloadAction<string>) => {
			state.drawing.history = action.payload;
		}),
		setDrawingZoom: ((state, action: PayloadAction<number>) => {
			state.drawing.zoom = action.payload;
		}),
		
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;
