export const botJobTypes = [ 'recorder', 'streamer', 'transcriber' ] as const;
export type BotJobType = typeof botJobTypes[number];

export type BotJobState = 'starting' | 'joined' | 'running' | 'stopping' | 'interrupted';

export interface BotProviderInfo {
	id: number;
	label: string;
	jobType: BotJobType;
}

export interface BotJobInfo {
	id: string;
	type: BotJobType;
	label: string;
	state: BotJobState;
	sessionId: string;
	peerId?: string;
}

export const asBotJobType = (value: unknown): BotJobType | undefined =>
	botJobTypes.find((type) => type === value);

export const botStatuses = [ 'running', 'finished', 'failed' ] as const;
export type BotStatus = typeof botStatuses[number];

export const asBotStatus = (value: unknown): BotStatus | undefined =>
	botStatuses.find((status) => status === value);

// A job is shown to the room while it captures, and as a warning while its bot
// is away; before that and while it stops there is nothing to disclose yet.
export const disclosedJobs = (jobs: BotJobInfo[]): BotJobInfo[] =>
	jobs.filter((job) => job.state === 'running' || job.state === 'interrupted');

export interface DisclosedKind {
	type: BotJobType;
	running: boolean;
	label: string;
}

// One entry per kind of job, however many bots run it; a kind counts as running
// as soon as one of its jobs is.
export const disclosedKinds = (jobs: BotJobInfo[]): DisclosedKind[] => {
	const disclosed = disclosedJobs(jobs);

	return botJobTypes.flatMap((type) => {
		const ofType = disclosed.filter((job) => job.type === type);

		return ofType.length === 0 ? [] : [ { type, running: ofType.some((job) => job.state === 'running'), label: ofType[0].label } ];
	});
};

export interface BotMenu<Bot extends { id: string }> {
	// bots that belong to no job, removed by kicking them as before
	plainBots: Bot[];
	// jobs that can still be stopped through their provider
	stoppableJobIds: string[];
	// what "remove all" kicks: the plain bots, and the bots of jobs that are already
	// stopping and have not left
	kickablePeerIds: string[];
}

export const botMenu = <Bot extends { id: string }>(bots: Bot[], jobs: BotJobInfo[]): BotMenu<Bot> => {
	const jobPeerIds = jobs.map((job) => job.peerId);
	const plainBots = bots.filter((bot) => !jobPeerIds.includes(bot.id));
	const stuck = jobs.filter((job) => job.state === 'stopping' && job.peerId && bots.some((bot) => bot.id === job.peerId)).map((job) => job.peerId as string);

	return {
		plainBots,
		stoppableJobIds: jobs.filter((job) => job.state !== 'stopping').map((job) => job.id),
		kickablePeerIds: [ ...plainBots.map((bot) => bot.id), ...stuck ],
	};
};

// Part of the provider contract: a page that carries a job and finds the room not
// open yet tries again for a while, because after a room server restart the bot
// may be back before the first participant is.
export const BOT_RETRY_INTERVAL_MS = 3_000;
export const BOT_RETRY_WINDOW_MS = 30_000;

export const botRetryPlan = ({ reason, jobId, firstRefusedAt, now }: {
	reason?: string;
	jobId?: string;
	firstRefusedAt?: number;
	now: number;
}): { retry: boolean; firstRefusedAt?: number } => {
	if (reason !== 'roomNotOpen' || !jobId) return { retry: false };

	const since = firstRefusedAt ?? now;

	return now + BOT_RETRY_INTERVAL_MS - since <= BOT_RETRY_WINDOW_MS ? { retry: true, firstRefusedAt: since } : { retry: false };
};
