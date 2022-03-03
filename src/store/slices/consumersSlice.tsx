import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StateConsumer {
	id: string;
	peerId: string;
	kind: string;
	localPaused: boolean;
	remotePaused: boolean;
	source: string;
	track: MediaStreamTrack;
}

export interface ConsumersState {
	consumers: Record<string, StateConsumer>;
}

const initialState: ConsumersState = {
	consumers: {},
};

const consumersSlice = createSlice({
	name: 'consumers',
	initialState,
	reducers: {
		addConsumer: ((state, action: PayloadAction<{ consumer: StateConsumer }>) => {
			const { consumer } = action.payload;

			state.consumers[consumer.id] = consumer;
		}),
		removeConsumer: ((state, action: PayloadAction<{ consumerId: string }>) => {
			delete state.consumers[action.payload.consumerId];
		}),
		setConsumerPaused: ((
			state,
			action: PayloadAction<{ consumerId: string, local?: boolean }>
		) => {
			const { consumerId, local } = action.payload;

			if (local) state.consumers[consumerId].localPaused = true;
			else state.consumers[consumerId].remotePaused = true;
		}),
		setConsumerResumed: ((
			state,
			action: PayloadAction<{ consumerId: string, local?: boolean }>
		) => {
			const { consumerId, local } = action.payload;

			if (local) state.consumers[consumerId].localPaused = false;
			else state.consumers[consumerId].remotePaused = false;
		}),
	},
});

export const consumersActions = consumersSlice.actions;
export default consumersSlice;