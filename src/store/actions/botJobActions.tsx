import { AppThunk } from '../store';
import { Logger } from '../../utils/Logger';
import { BotJobType, asBotJobType, asBotStatus } from '../../utils/botJobs';
import { notificationsActions } from '../slices/notificationsSlice';
import { botJobStartFailedLabel, botJobStopFailedLabel } from '../../components/translated/translatedComponents';

const logger = new Logger('BotJobActions');

export const startBotJob = (type: BotJobType, providerId?: number): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('startBotJob() [type: %s]', type);

	try {
		await signalingService.sendRequest('moderator:startBotJob', { type, providerId });
	} catch (error) {
		logger.error('startBotJob() [error:"%o"]', error);

		dispatch(notificationsActions.enqueueNotification({
			message: botJobStartFailedLabel(),
			options: { variant: 'error' }
		}));
	}
};

export const stopBotJob = (jobId: string): AppThunk<Promise<void>> => async (
	dispatch,
	_getState,
	{ signalingService }
): Promise<void> => {
	logger.debug('stopBotJob() [jobId: %s]', jobId);

	try {
		await signalingService.sendRequest('moderator:stopBotJob', { jobId });
	} catch (error) {
		logger.error('stopBotJob() [error:"%o"]', error);

		dispatch(notificationsActions.enqueueNotification({
			message: botJobStopFailedLabel(),
			options: { variant: 'error' }
		}));
	}
};

const MAX_REASON_LENGTH = 200;

// What `window.edumeetBot.status()` does: only the page of a bot that runs jobs, once
// it is in the room, has anything to report. A kind names the one job a `finished` or
// `failed` is about; `running` is always the whole bot's heartbeat. The return value
// tells the provider whether it was sent.
export const sendBotStatus = (status: unknown, reason?: unknown, type?: unknown): AppThunk<boolean> => (
	_dispatch,
	getState,
	{ signalingService }
): boolean => {
	const { room, me } = getState();
	const state = asBotStatus(status);

	const kind = asBotJobType(type);

	if (!state || !room.headless || !me.botId || room.state !== 'joined') return false;
	// A kind that is no kind would read as the whole bot, so nothing is sent.
	if (state !== 'running' && type != null && !kind) return false;

	signalingService.notify('botStatus', {
		state,
		...(state === 'failed' && typeof reason === 'string' && reason ? { reason: reason.slice(0, MAX_REASON_LENGTH) } : {}),
		...(state !== 'running' && kind ? { type: kind } : {})
	});

	return true;
};
