import { botTypeFromUrl, headlessFromUrl } from './headless';

export const botJobTypes = [ 'recorder', 'streamer', 'transcriber' ] as const;
export type BotJobType = typeof botJobTypes[number];

export type BotJobState = 'starting' | 'joined' | 'running' | 'stopping' | 'interrupted';

export interface BotProviderInfo {
	id: number;
	label: string;
	jobTypes: BotJobType[];
}

export interface BotJobInfo {
	id: string;
	type: BotJobType;
	label: string;
	providerId?: number;
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

	// One bot may run several jobs, so it is named once.
	return {
		plainBots,
		stoppableJobIds: jobs.filter((job) => job.state !== 'stopping').map((job) => job.id),
		kickablePeerIds: [ ...new Set([ ...plainBots.map((bot) => bot.id), ...stuck ]) ],
	};
};

// The kinds a moderator is offered to start: those a provider offers, less those that
// already run in the session. A job that is stopping no longer counts, as for the room server.
export const offeredKinds = (providers: BotProviderInfo[], jobs: BotJobInfo[]): BotJobType[] =>
	botJobTypes.filter((type) => providers.some((p) => kindsOf(p).includes(type)) && !jobs.some((job) => job.type === type && job.state !== 'stopping'));

// A room server from before providers offered several kinds sends none here; its
// providers then offer nothing rather than breaking the page.
export const kindsOf = (provider: BotProviderInfo): BotJobType[] => (Array.isArray(provider.jobTypes) ? provider.jobTypes : []);

// Whether the provider's bot is in the session to take a new kind on: it has joined and
// not left. One still on its way is not there yet, and one that is leaving is replaced.
export const providerBotPresent = (jobs: BotJobInfo[], providerId: number): boolean =>
	jobs.some((job) => job.providerId === providerId && (job.state === 'joined' || job.state === 'running'));

// The rows of the bot menu that carry a Kick button: the jobs a moderator can only end
// by removing their bot, and of those one per bot, since removing it ends them all.
export const kickRowJobIds = (jobs: BotJobInfo[], canStop: boolean): Set<string> => {
	const bots = new Set<string>();
	const rows = new Set<string>();

	for (const job of jobs) {
		if (!job.peerId || (canStop && job.state !== 'stopping') || bots.has(job.peerId)) continue;

		bots.add(job.peerId);
		rows.add(job.id);
	}

	return rows;
};

// A transcriber only listens. Declaring no video codec means the room server never
// creates a video consumer for it: no transceivers, nothing on the media node, and
// no video in the encryption path. Cameras, screens and extra video alike. Only the
// bot of a transcription-only provider is sent as a transcriber; a bot that may be
// asked to record as well is sent without a kind and takes everything.
export const transcriberPage = (href?: string): boolean =>
	headlessFromUrl(href) === true && botTypeFromUrl(href) === 'transcriber';

export const audioOnlyCapabilities = <T extends { codecs?: { kind: string }[]; headerExtensions?: { kind: string }[] }>(capabilities: T): T => ({
	...capabilities,
	codecs: (capabilities.codecs ?? []).filter((codec) => codec.kind === 'audio'),
	headerExtensions: (capabilities.headerExtensions ?? []).filter((extension) => extension.kind === 'audio'),
});

// Part of the provider contract: a page that carries a bot id and finds the room not
// open yet tries again for a while, because after a room server restart the bot
// may be back before the first participant is.
export const BOT_RETRY_INTERVAL_MS = 3_000;
export const BOT_RETRY_WINDOW_MS = 30_000;

export const botRetryPlan = ({ reason, botId, firstRefusedAt, now }: {
	reason?: string;
	botId?: string;
	firstRefusedAt?: number;
	now: number;
}): { retry: boolean; firstRefusedAt?: number } => {
	if (reason !== 'roomNotOpen' || !botId) return { retry: false };

	const since = firstRefusedAt ?? now;

	return now + BOT_RETRY_INTERVAL_MS - since <= BOT_RETRY_WINDOW_MS ? { retry: true, firstRefusedAt: since } : { retry: false };
};
