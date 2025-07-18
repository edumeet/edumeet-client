import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import edumeetConfig from '../../utils/edumeetConfig';

export type RoomConnectionState = 'new' | 'lobby' | 'joined' | 'left' | 'mgmt-admin';
export type RoomMode = 'P2P' | 'SFU';
export type VideoCodec = 'vp8' | 'vp9' | 'h264' | 'h265' | 'av1';

interface CountdownTimerState {
	isEnabled: boolean;
	isStarted: boolean;
	initialTime: string;
	remainingTime: string;
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
	countdownTimer: CountdownTimerState;
}

type RoomUpdate = Omit<RoomState, 'roomMode' | 'state' | 'countdownTimer'>;

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
	countdownTimer: {
		isEnabled: true,
		isStarted: false,
		initialTime: '00:00:00',
		remainingTime: '00:00:00',
	},
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
		enableCountdownTimer: ((state) => {
			state.countdownTimer.isEnabled = true;
		}),
		disableCountdownTimer: ((state) => {
			state.countdownTimer.isEnabled = false;
		}),
		startCountdownTimer: ((state) => {
			state.countdownTimer.isStarted = true;
		}),
		stopCountdownTimer: ((state) => {
			state.countdownTimer.isStarted = false;
		}),
		setCountdownTimerRemainingTime: ((state, action: PayloadAction<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
			
			const time = action.payload;

			state.countdownTimer.remainingTime = time;
		}),
		setCountdownTimerInitialTime: ((state, action: PayloadAction<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any

			const time = action.payload;
			
			state.countdownTimer.initialTime = time;
		}),
		finishCountdownTimer: ((state, action: PayloadAction<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any

			state.countdownTimer.isStarted = action.payload.isStarted;
			state.countdownTimer.remainingTime = action.payload.remainingTime;
		}),
		joinCountdownTimer: ((state, action: PayloadAction<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
			state.countdownTimer.initialTime = action.payload.initialTime;
			state.countdownTimer.remainingTime = action.payload.remainingTime;
		}),
	}
});

export const roomActions = roomSlice.actions;
export default roomSlice;
