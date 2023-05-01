import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

export interface BreakoutRoom {
	name?: string;
	sessionId: string;
}

type BreakoutRoomUpdate = Partial<BreakoutRoom>;

export type BreakoutRoomsState = BreakoutRoom[];

const initialState: BreakoutRoomsState = [];

const breakoutRoomsSlice = createSlice({
	name: 'breakoutRooms',
	initialState,
	reducers: {
		addBreakoutRoom: ((state, action: PayloadAction<BreakoutRoom>) => {
			state.push(action.payload);
		}),
		addBreakoutRooms: ((state, action: PayloadAction<BreakoutRoom[]>) => {
			state.push(...action.payload);
		}),
		removeBreakoutRoom: ((state, action: PayloadAction<BreakoutRoomUpdate>) => {
			return state.filter((b) => b.sessionId !== action.payload.sessionId);
		}),
		updateBreakoutRoom: ((state, action: PayloadAction<BreakoutRoomUpdate>) => {
			const breakoutRoom = state.find((b) => b.sessionId === action.payload.sessionId);

			if (breakoutRoom) {
				const {
					name
				} = action.payload;

				breakoutRoom.name = name;
			}
		})
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return [];
			});
	}
});

export const breakoutRoomsActions = breakoutRoomsSlice.actions;
export default breakoutRoomsSlice;