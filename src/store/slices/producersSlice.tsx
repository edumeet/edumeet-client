import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

export interface StateProducer {
	id: string;
	kind: string;
	source: ProducerSource;
	paused: boolean;
	score: number;
}

export type ProducerSource = 'mic' | 'webcam' | 'screen' | 'extravideo';

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

			if (producer)
				producer.paused = true;
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

			if (producer)
				producer.paused = false;
		}),
		setScore: ((state, action: PayloadAction<{ producerId: string, score: number}>) => {
			const { producerId, score } = action.payload; 
			const producer = state.find((c) => c.id === producerId);

			if (producer) {
				producer.score = score;
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

export const producersActions = producersSlice.actions;
export default producersSlice;