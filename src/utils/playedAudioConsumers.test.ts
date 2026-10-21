import { describe, expect, it } from 'vitest';

import type { StateConsumer } from '../store/slices/consumersSlice';
import { playedAudioConsumerIds } from './playedAudioConsumers';

const consumer = (id: string, paused: { localPaused?: boolean, remotePaused?: boolean } = {}): StateConsumer => ({
	id,
	peerId: `peer-${id}`,
	kind: 'audio',
	localPaused: false,
	remotePaused: false,
	...paused,
} as StateConsumer);

describe('which audio consumers get an audio element', () => {
	it('not a participant who has been muted all along', () => {
		expect(playedAudioConsumerIds([ consumer('a', { remotePaused: true }) ], new Set())).toEqual(new Set());
	});

	it('a participant who speaks', () => {
		expect(playedAudioConsumerIds([ consumer('a') ], new Set())).toEqual(new Set([ 'a' ]));
	});

	it('keeps a participant who spoke and muted again', () => {
		let played = playedAudioConsumerIds([ consumer('a') ], new Set());

		played = playedAudioConsumerIds([ consumer('a', { remotePaused: true }) ], played);

		expect(played).toEqual(new Set([ 'a' ]));
	});

	it('keeps a participant who spoke and was then muted locally', () => {
		const played = playedAudioConsumerIds([ consumer('a', { localPaused: true }) ], new Set([ 'a' ]));

		expect(played).toEqual(new Set([ 'a' ]));
	});

	it('not a participant muted locally before speaking', () => {
		expect(playedAudioConsumerIds([ consumer('a', { localPaused: true }) ], new Set())).toEqual(new Set());
	});

	it('forgets a consumer that is gone, so a new one for the same participant starts over', () => {
		const played = playedAudioConsumerIds([ consumer('b', { remotePaused: true }) ], new Set([ 'a', 'b' ]));

		expect(played).toEqual(new Set([ 'b' ]));
	});
});
