import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { peersActions } from './peersSlice';

export interface StateConsumer {
	id: string;
	peerId: string;
	kind: string;
	localPaused: boolean;
	remotePaused: boolean;
	source: string;
	trackId: string;
}

type ConsumersState = StateConsumer[];

const initialState: ConsumersState = [];

const consumersSlice = createSlice({
	name: 'consumers',
	initialState,
	reducers: {
		addConsumer: ((state, action: PayloadAction<StateConsumer>) => {
			state.push(action.payload);
		}),
		removeConsumer: ((
			state,
			action: PayloadAction<{ consumerId: string, local?: boolean }>
		) => {
			return state.filter((consumer) => consumer.id !== action.payload.consumerId);
		}),
		setConsumerPaused: ((
			state,
			action: PayloadAction<{ consumerId: string, local?: boolean }>
		) => {
			const { consumerId, local } = action.payload;
			const consumer = state.find((c) => c.id === consumerId);

			if (consumer) {
				if (local) {
					consumer.localPaused = true;
				} else {
					consumer.remotePaused = true;
				}
			}
		}),
		setConsumerResumed: ((
			state,
			action: PayloadAction<{ consumerId: string, local?: boolean }>
		) => {
			const { consumerId, local } = action.payload;
			const consumer = state.find((c) => c.id === consumerId);

			if (consumer) {
				if (local) {
					consumer.localPaused = false;
				} else {
					consumer.remotePaused = false;
				}
			}
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.removePeer, (state, action) => {
				return state.filter((consumer) => consumer.peerId !== action.payload.id);
			});
	}
});

export const consumersActions = consumersSlice.actions;
export default consumersSlice;