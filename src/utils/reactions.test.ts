import { describe, expect, it } from 'vitest';
import { REACTIONS, isReaction, reactionEmojis, reactionEntry, receivedReaction } from './reactions';

const BAD = [ '__proto__', 'constructor', 'toString', 'hasOwnProperty', '', 'x'.repeat(1000), 'Thumbup', 42, {}, [ 'clap' ], true ];

describe('reactions', () => {
	it('accepts the known reactions only', () => {
		for (const reaction of REACTIONS) expect(isReaction(reaction)).toBe(true);
		for (const value of BAD) expect(isReaction(value)).toBe(false);
	});

	it('keeps undefined and null of a notification and drops unknown values', () => {
		expect(receivedReaction(undefined)).toBeUndefined();
		expect(receivedReaction(null)).toBeNull();
		expect(receivedReaction('party')).toBe('party');
		for (const value of BAD) expect(receivedReaction(value)).toBeUndefined();
	});

	it('looks reactions up as own properties only', () => {
		expect(reactionEntry(reactionEmojis, 'clap')).toBe('👏');
		for (const value of BAD) expect(reactionEntry(reactionEmojis, value)).toBeUndefined();
	});
});
