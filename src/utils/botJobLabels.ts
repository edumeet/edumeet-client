import {
	botJobConfirmRecorderLabel,
	botJobConfirmStreamerLabel,
	botJobConfirmTranscriberLabel,
	botJobConfirmMoreRecorderLabel,
	botJobConfirmMoreStreamerLabel,
	botJobConfirmMoreTranscriberLabel,
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
	botJobTypeRecorderLabel,
	botJobTypeStreamerLabel,
	botJobTypeTranscriberLabel,
} from '../components/translated/translatedComponents';
import { BotJobState, BotJobType } from './botJobs';

export const botJobStartLabel = (type: BotJobType): string => ({
	recorder: botJobStartRecorderLabel,
	streamer: botJobStartStreamerLabel,
	transcriber: botJobStartTranscriberLabel,
})[type]();

// A provider whose bot is already in the session takes the new kind on there.
export const botJobConfirmLabel = (type: BotJobType, name: string, botPresent = false): string => (botPresent ? {
	recorder: botJobConfirmMoreRecorderLabel,
	streamer: botJobConfirmMoreStreamerLabel,
	transcriber: botJobConfirmMoreTranscriberLabel,
} : {
	recorder: botJobConfirmRecorderLabel,
	streamer: botJobConfirmStreamerLabel,
	transcriber: botJobConfirmTranscriberLabel,
})[type](name);

export const botJobKindLabel = (type: BotJobType): string => ({
	recorder: botJobTypeRecorderLabel,
	streamer: botJobTypeStreamerLabel,
	transcriber: botJobTypeTranscriberLabel,
})[type]();

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
