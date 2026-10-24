import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { sendBotStatus } from '../store/actions/botJobActions';
import { BotHeartbeat, botHeartbeat, botHeartbeatWanted, edumeetBotApi } from './botHeartbeat';

declare global {
	interface Window {
		// eslint-disable-next-line no-unused-vars
		edumeetBot?: { status: (state: string, reason?: string, type?: string) => boolean };
	}
}

// How the room learns how a bot's jobs are doing. The page reports itself running while
// it is in the room. The provider behind it may say more with `window.edumeetBot.status`:
// 'finished' or 'failed', for the whole bot or, with a kind, for that one job, and
// 'running' itself, which takes the heartbeat over from the page. The function exists
// only on the page of a bot that runs jobs.
export const useBotStatusHook = (): void => {
	const dispatch = useAppDispatch();
	const active = useAppSelector((state) => Boolean(state.room.headless && state.me.botId));
	const beating = useAppSelector((state) => botHeartbeatWanted({ headless: state.room.headless, botId: state.me.botId, state: state.room.state, entered: state.room.entered }));
	const heartbeat = useRef<BotHeartbeat | undefined>(undefined);

	if (!heartbeat.current) heartbeat.current = botHeartbeat(() => dispatch(sendBotStatus('running')));

	useEffect(() => {
		if (!active) return;

		if (heartbeat.current) window.edumeetBot = edumeetBotApi(heartbeat.current, (state, reason, type) => dispatch(sendBotStatus(state, reason, type)));

		return () => {
			delete window.edumeetBot;
		};
	}, [ active, dispatch ]);

	useEffect(() => {
		if (!beating) return;

		heartbeat.current?.start();

		return () => heartbeat.current?.stop();
	}, [ beating ]);
};
