// Part of the provider contract: a bot page reports itself as running while it is in
// the room, so a provider whose browser only records needs no code for edumeet. A
// provider that reports `running` itself takes the heartbeat over for good, which keeps
// its own, closer watch on the recorder: a page that stays connected while the capture
// behind it hangs then goes silent, and edumeet notices.
export const BOT_HEARTBEAT_MS = 20_000;

export interface BotHeartbeat {
	start: () => void;
	stop: () => void;
	handOver: () => void;
}

export const botHeartbeat = (send: () => void, intervalMs = BOT_HEARTBEAT_MS): BotHeartbeat => {
	let timer: ReturnType<typeof setInterval> | undefined;
	let handedOver = false;

	const stop = (): void => {
		if (timer) clearInterval(timer);
		timer = undefined;
	};

	return {
		start: () => {
			if (handedOver || timer) return;

			send();
			timer = setInterval(send, intervalMs);
		},
		stop,
		handOver: () => {
			handedOver = true;
			stop();
		},
	};
};

/* eslint-disable no-unused-vars */
export type SendBotStatus = (state: string, reason?: string, type?: string) => boolean;
/* eslint-enable no-unused-vars */

// What `window.edumeetBot` is on a bot page: the provider's own `running` takes the
// heartbeat over before the report goes out.
export const edumeetBotApi = (heartbeat: BotHeartbeat, sendStatus: SendBotStatus): { status: SendBotStatus } => ({
	status: (state, reason, type) => {
		if (state === 'running') heartbeat.handOver();

		return sendStatus(state, reason, type);
	},
});

// The page's heartbeat runs while a bot page is in the room, counted from the moment
// the room server took its join: a report before that reaches a page the room server
// does not yet treat as a bot of a job, and is lost.
export const botHeartbeatWanted = ({ headless, botId, state, entered }: {
	headless?: boolean;
	botId?: string;
	state?: string;
	entered?: boolean;
}): boolean => Boolean(headless && botId && state === 'joined' && entered);
