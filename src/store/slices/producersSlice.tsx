import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StateProducer {
	id: string;
	kind: string;
	source: ProducerSource;
	paused: boolean;
}

type ProducerSource = 'mic' | 'webcam' | 'screen' | 'extravideo';

type ProducersState = StateProducer[];

const initialState: ProducersState = [];

const producersSlice = createSlice({
	name: 'producers',
	initialState,
	reducers: {
		addProducer: ((state, action: PayloadAction<StateProducer>) => {
			state.push(action.payload);
		}),
		closeProducer: ((
			state,
			action: PayloadAction<{
				producerId: string,
				local?: boolean,
				source?: ProducerSource,
			}>
		) => {
			return state.filter((producer) => producer.id !== action.payload.producerId);
		}),
		setProducerPaused: ((
			state,
			action: PayloadAction<{
				producerId: string,
				local?: boolean,
				source?: ProducerSource,
			}>
		) => {
			const { producerId } = action.payload;
			const producer = state.find((p) => p.id === producerId);

			if (producer) {
				producer.paused = true;
			}
		}),
		setProducerResumed: ((
			state,
			action: PayloadAction<{
				producerId: string,
				local?: boolean,
				source?: ProducerSource,
			}>
		) => {
			const { producerId } = action.payload;
			const producer = state.find((p) => p.id === producerId);

			if (producer) {
				producer.paused = false;
			}
		}),
	},
});

export const producersActions = producersSlice.actions;
export default producersSlice;