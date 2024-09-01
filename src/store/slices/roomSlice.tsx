import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export type RoomConnectionState = 'new' | 'lobby' | 'joined' | 'left';
export type RoomMode = 'P2P' | 'SFU';
export type VideoCodec = 'vp8' | 'vp9' | 'h264' | 'h265' | 'av1';

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
	drawing: {
		zoom: number,
		tools: [ 'pencilBrush', 'text', 'eraser' ],
		tool: RoomState['drawing']['tools'][number],
		pencilBrushSize: number,
		pencilBrushSizeRange: { min: number, max: number },
		textSize: number,
		textSizeRange: { min: number, max: number },
		eraserSize: number,
		eraserSizeRange: { min: number, max: number },
		colorsMenus: [ 'Row', 'Menu' ],
		colorsMenu: RoomState['drawing']['colorsMenus'][number],
		colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
		color: RoomState['drawing']['colors'][number],
		bgColors: ['lightgray', 'white', 'black'],
		bgColor: RoomState['drawing']['bgColors'][number]
		history: string
		historyUndo: fabric.Object[]
		historyRedo: fabric.Object[]
	}
}

type RoomUpdate = Omit<RoomState, 'roomMode' | 'state'>;

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
		tools: [ 'pencilBrush', 'text', 'eraser' ],
		tool: 'pencilBrush',
		pencilBrushSize: 20,
		pencilBrushSizeRange: { min: 1, max: 100 },
		textSize: 30,
		textSizeRange: { min: 1, max: 100 },
		eraserSize: 60,
		eraserSizeRange: { min: 1, max: 100 },
		zoom: 10,
		colorsMenus: [ 'Row', 'Menu' ],
		colorsMenu: 'Menu',
		colors: [ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ],
		color: 'black',
		bgColors: [ 'lightgray', 'white', 'black' ],
		bgColor: 'lightgray',
		history: '',
		historyUndo: [],
		historyRedo: [],
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
		setDrawingTool: ((state, action: PayloadAction<RoomState['drawing']['tool']>) => {
			state.drawing.tool = action.payload;
		}),
		setDrawingColorsMenu: ((state, action: PayloadAction<RoomState['drawing']['colorsMenu']>) => {
			state.drawing.colorsMenu = action.payload;
		}),
		setDrawingColor: ((state, action: PayloadAction<RoomState['drawing']['color']>) => {
			state.drawing.color = action.payload;
		}),
		setDrawingHistory: ((state, action: PayloadAction<string>) => {
			state.drawing.history = action.payload;
		}),
		setDrawingZoom: ((state, action: PayloadAction<number>) => {
			state.drawing.zoom = action.payload;
		}),
		setDrawingPencilBrushSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.drawing.pencilBrushSizeRange;
			const curr = state.drawing.pencilBrushSize;

			(operation === 'inc' && curr < max) && state.drawing.pencilBrushSize++;
			(operation === 'dec' && curr > min) && state.drawing.pencilBrushSize--;
		}),
	
		setDrawingTextSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.drawing.textSizeRange;
			const curr = state.drawing.textSize;

			(operation === 'inc' && curr < max) && state.drawing.textSize++;
			(operation === 'dec' && curr > min) && state.drawing.textSize--;
		}),
	
		setDrawingEraserSize: ((state, action: PayloadAction<{ operation: 'inc' | 'dec'}>) => {
			
			const operation = action.payload.operation;
			const { min, max } = state.drawing.eraserSizeRange;
			const curr = state.drawing.eraserSize;

			(operation === 'inc' && curr < max) && state.drawing.eraserSize++;
			(operation === 'dec' && curr > min) && state.drawing.eraserSize--;
		}),
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;
