import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendBotStatus } from '../store/actions/botJobActions';

declare global {
	interface Window {
		// eslint-disable-next-line no-unused-vars
		edumeetBot?: { status: (state: string, reason?: string, type?: string) => boolean };
	}
}

// How the provider behind a bot page tells the room how its jobs are doing: it calls
// `window.edumeetBot.status('running')` while it captures, and 'finished' or
// 'failed' at the end, for the whole bot or, with a kind, for that one job. The
// function exists only on the page of a bot that runs jobs.
export const useBotStatusHook = (): void => {
	const dispatch = useAppDispatch();
	const active = useAppSelector((state) => Boolean(state.room.headless && state.me.botId));

	useEffect(() => {
		if (!active) return;

		window.edumeetBot = { status: (state, reason, type) => dispatch(sendBotStatus(state, reason, type)) };

		return () => {
			delete window.edumeetBot;
		};
	}, [ active, dispatch ]);
};
