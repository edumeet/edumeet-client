import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StateProducer {
	id: string;
	kind: string;
	source: string;
	paused: boolean;
	trackId: string;
}

export interface ProducersState {
	producers: Record<string, StateProducer>;
}

const initialState: ProducersState = {
	producers: {},
};

const producersSlice = createSlice({
	name: 'producers',
	initialState,
	reducers: {
		addProducer: ((state, action: PayloadAction<StateProducer>) => {
			state.producers[action.payload.id] = action.payload;
		}),
		closeProducer: ((
			state,
			action: PayloadAction<{ producerId: string, local?: boolean }>
		) => {
			delete state.producers[action.payload.producerId];
		}),
		setProducerPaused: ((
			state,
			action: PayloadAction<{ producerId: string, local?: boolean }>
		) => {
			state.producers[action.payload.producerId].paused = true;
		}),
		setProducerResumed: ((
			state,
			action: PayloadAction<{ producerId: string, local?: boolean }>
		) => {
			state.producers[action.payload.producerId].paused = false;
		}),
	},
});

export const producersActions = producersSlice.actions;
export default producersSlice;