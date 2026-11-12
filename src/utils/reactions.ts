// Reactions come from other participants through the room server. A value other than
// these four, such as an Object.prototype property name (__proto__, constructor) or a
// non-string, must not reach the store, an icon lookup or the notification sound key.
export const REACTIONS = [ 'thumbup', 'clap', 'party', 'laugh' ] as const;

export type Reaction = typeof REACTIONS[number];

export const isReaction = (value: unknown): value is Reaction =>
	typeof value === 'string' && (REACTIONS as readonly string[]).includes(value);

// A reaction field of a peer notification: undefined leaves the peer's reaction as it is,
// null clears it, and anything that is not a known reaction is dropped as undefined.
export const receivedReaction = (value: unknown): Reaction | null | undefined => {
	if (value === null) return null;

	return isReaction(value) ? value : undefined;
};

// Looks a reaction up in a map keyed by reaction, never in the map's prototype.
export const reactionEntry = <T>(map: Record<Reaction, T>, reaction: unknown): T | undefined =>
	(isReaction(reaction) && Object.hasOwn(map, reaction) ? map[reaction] : undefined);

export const reactionEmojis: Record<Reaction, string> = {
	thumbup: '👍',
	clap: '👏',
	party: '🎉',
	laugh: '😂',
};
