import { AppThunk } from '../store';
import { Logger } from '../../utils/Logger';
import { BotJobType, asBotStatus } from '../../utils/botJobs';
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

// What `window.edumeetBot.status()` does: only the page of a job, once it is in the
// room, has anything to report. The return value tells the recorder whether it was sent.
export const sendBotStatus = (status: unknown, reason?: unknown): AppThunk<boolean> => (
	_dispatch,
	getState,
	{ signalingService }
): boolean => {
	const { room, me } = getState();
	const state = asBotStatus(status);

	if (!state || !room.headless || !me.botJobId || room.state !== 'joined') return false;

	signalingService.notify('botStatus', {
		state,
		...(state === 'failed' && typeof reason === 'string' && reason ? { reason: reason.slice(0, MAX_REASON_LENGTH) } : {})
	});

	return true;
};
