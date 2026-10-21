import type { StateConsumer } from '../store/slices/consumersSlice';

export const playedAudioConsumerIds = (
	consumers: StateConsumer[],
	played: ReadonlySet<string>
): Set<string> => new Set(
	consumers
		.filter((consumer) => played.has(consumer.id) || (!consumer.localPaused && !consumer.remotePaused))
		.map((consumer) => consumer.id)
);
