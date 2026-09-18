import edumeetConfig from './edumeetConfig';

const MASK_CHARACTER = '•';

/**
 * Masks a display name while keeping it recognizable:
 * every whitespace separated part keeps its first character and the rest is
 * replaced with a mask character.
 *
 * `Jane Doe` -> `J••• D••`
 *
 * The transformation is idempotent, so masking an already masked name is a
 * no-op.
 */
export const maskDisplayName = (displayName?: string): string | undefined => {
	if (!displayName) return displayName;

	return displayName.replace(/\S+/gu, (part) => {
		const characters = Array.from(part);
		const [ first ] = characters;

		if (characters.length < 2) return part;

		return `${first}${MASK_CHARACTER.repeat(characters.length - 1)}`;
	});
};

/**
 * Masks a display name for the client monitor's attachments when the
 * `obfuscateDisplayName` config flag is set, otherwise returns it unchanged.
 *
 * This is ONLY for data leaving the client as ObserveRTC monitoring samples.
 * The UI always shows real display names - do not use this helper for
 * rendering.
 */
export const obfuscateDisplayNameForMonitoring = (displayName?: string): string | undefined => {
	if (!edumeetConfig.obfuscateDisplayName) return displayName;

	return maskDisplayName(displayName);
};

/**
 * The room identifier for the client monitor's attachments: the room name, or
 * the room's session id when the `obfuscateRoomName` config flag is set. The
 * session id is the main room's, which the monitor already uses as its call
 * id, so breakout rooms stay filed under their room.
 */
export const roomIdForMonitoring = (roomName: string | undefined, sessionId: string): string | undefined => {
	if (!edumeetConfig.obfuscateRoomName) return roomName;

	return sessionId;
};
