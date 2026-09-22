import {
	botJobConfirmRecorderLabel,
	botJobConfirmStreamerLabel,
	botJobConfirmTranscriberLabel,
	botJobDeliveryNoticeRecorderLabel,
	botJobDeliveryNoticeStreamerLabel,
	botJobDeliveryNoticeTranscriberLabel,
	botJobRunningRecorderLabel,
	botJobRunningStreamerLabel,
	botJobRunningTranscriberLabel,
	botJobStartRecorderLabel,
	botJobStartStreamerLabel,
	botJobStartTranscriberLabel,
	botJobStateInterruptedLabel,
	botJobStateJoinedLabel,
	botJobStateRunningLabel,
	botJobStateStartingLabel,
	botJobStateStoppingLabel,
} from '../components/translated/translatedComponents';
import { BotJobState, BotJobType } from './botJobs';

export const botJobStartLabel = (type: BotJobType): string => ({
	recorder: botJobStartRecorderLabel,
	streamer: botJobStartStreamerLabel,
	transcriber: botJobStartTranscriberLabel,
})[type]();

export const botJobConfirmLabel = (type: BotJobType, name: string): string => ({
	recorder: botJobConfirmRecorderLabel,
	streamer: botJobConfirmStreamerLabel,
	transcriber: botJobConfirmTranscriberLabel,
})[type](name);

export const botJobDeliveryNoticeLabel = (type: BotJobType): string => ({
	recorder: botJobDeliveryNoticeRecorderLabel,
	streamer: botJobDeliveryNoticeStreamerLabel,
	transcriber: botJobDeliveryNoticeTranscriberLabel,
})[type]();

export const botJobRunningLabel = (type: BotJobType): string => ({
	recorder: botJobRunningRecorderLabel,
	streamer: botJobRunningStreamerLabel,
	transcriber: botJobRunningTranscriberLabel,
})[type]();

export const botJobStateLabel = (state: BotJobState): string => ({
	starting: botJobStateStartingLabel,
	joined: botJobStateJoinedLabel,
	running: botJobStateRunningLabel,
	stopping: botJobStateStoppingLabel,
	interrupted: botJobStateInterruptedLabel,
})[state]();
