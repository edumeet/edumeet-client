import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../utils/types';
import { peersActions } from './peersSlice';

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
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.updatePeer, (state, action) => {
				if (action.payload.displayName) {
					const { id, displayName } = action.payload;

					return state.map((message) => {
						if (message.peerId === id) {
							return { ...message, displayName };
						}

						return message;
					});
				}
			});
	}
});

export const chatActions = chatSlice.actions;
export default chatSlice;