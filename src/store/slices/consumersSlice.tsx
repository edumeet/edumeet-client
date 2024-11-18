import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { peersActions } from './peersSlice';
import { roomActions } from './roomSlice';
import { ProducerSource } from '../../utils/types';

export interface StateConsumer {
	id: string;
	peerId: string;
	peerConsumer: boolean;
	kind: string;
	audioGain?: number;
	localPaused: boolean;
	remotePaused: boolean;
	source: ProducerSource;
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
		removeConsumer: ((state, action: PayloadAction<{ consumerId: string, local?: boolean }>) => {
			return state.filter((consumer) => consumer.id !== action.payload.consumerId);
		}),
		setAudioGain: ((state, action: PayloadAction<{ consumerId: string, audioGain?: number }>) => {
			const consumer = state.find((c) => c.id === action.payload.consumerId);

			if (consumer)
				consumer.audioGain = action.payload.audioGain;
		}),
		setConsumerPaused: ((state, action: PayloadAction<{ consumerId: string, local?: boolean }>) => {
			const { consumerId, local } = action.payload;
			const consumer = state.find((c) => c.id === consumerId);

			if (consumer && local !== undefined) {
				if (local)
					consumer.localPaused = true;
				else
					consumer.remotePaused = true;
			}
		}),
		setConsumerResumed: ((state, action: PayloadAction<{ consumerId: string, local?: boolean }>) => {
			const { consumerId, local } = action.payload;
			const consumer = state.find((c) => c.id === consumerId);

			if (consumer && local !== undefined) {
				if (local)
					consumer.localPaused = false;
				else
					consumer.remotePaused = false;
			}
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(peersActions.removePeer, (state, { payload: { id } }) => state.filter((consumer) => consumer.peerId !== id))
			.addCase(roomActions.setState, (_state, { payload }) => {
				if (payload === 'left') return [];
			});
	}
});

export const consumersActions = consumersSlice.actions;
export default consumersSlice;
