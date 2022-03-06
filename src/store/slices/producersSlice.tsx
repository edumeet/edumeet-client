import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StateProducer {
	id: string;
	kind: string;
	source: string;
	paused: boolean;
	track: MediaStreamTrack;
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
		removeProducer: ((state, action: PayloadAction<StateProducer>) => {
			delete state.producers[action.payload.id];
		}),
		setProducerPaused: ((
			state,
			action: PayloadAction<{ id: string }>
		) => {
			state.producers[action.payload.id].paused = true;
		}),
		setProducerResumed: ((
			state,
			action: PayloadAction<{ id: string }>
		) => {
			state.producers[action.payload.id].paused = false;
		}),
	},
});

export const producersActions = producersSlice.actions;
export default producersSlice;