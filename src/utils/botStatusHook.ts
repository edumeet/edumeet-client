import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendBotStatus } from '../store/actions/botJobActions';

declare global {
	interface Window {
		// eslint-disable-next-line no-unused-vars
		edumeetBot?: { status: (state: string, reason?: string) => boolean };
	}
}

// How the recorder behind a job page tells the room how its job is doing: it calls
// `window.edumeetBot.status('running')` while it captures, and 'finished' or
// 'failed' at the end. The function exists only on the page of a job.
export const useBotStatusHook = (): void => {
	const dispatch = useAppDispatch();
	const active = useAppSelector((state) => Boolean(state.room.headless && state.me.botJobId));

	useEffect(() => {
		if (!active) return;

		window.edumeetBot = { status: (state, reason) => dispatch(sendBotStatus(state, reason)) };

		return () => {
			delete window.edumeetBot;
		};
	}, [ active, dispatch ]);
};
