import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BotJobInfo, BotProviderInfo } from '../../utils/botJobs';

export interface BotJobsState {
	providers: BotProviderInfo[];
	jobs: BotJobInfo[];
}

const initialState: BotJobsState = {
	providers: [],
	jobs: [],
};

const botJobsSlice = createSlice({
	name: 'botJobs',
	initialState,
	reducers: {
		setProviders: ((state, action: PayloadAction<BotProviderInfo[]>) => {
			state.providers = action.payload;
		}),
		// The server only ever sends a participant the jobs of the session it is in.
		setJobs: ((state, action: PayloadAction<BotJobInfo[]>) => {
			state.jobs = action.payload;
		}),
	},
});

export const botJobsActions = botJobsSlice.actions;
export default botJobsSlice;
