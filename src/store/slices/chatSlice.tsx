import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../utils/types';

type ChatState = ChatMessage[];

const initialState: ChatState = [];

const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		addMessage: ((state, action: PayloadAction<ChatMessage>) => {
			state.push(action.payload);
		}),
		addMessages: ((state, action: PayloadAction<ChatMessage[]>) => {
			return [ ...state, ...action.payload ];
		}),
		clearChat: (() => {
			return [];
		}),
	}
});

export const chatActions = chatSlice.actions;
export default chatSlice;