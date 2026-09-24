import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param reconnectKey - The reconnectKey of the client.
 * @param token - The token of the user.
 * @param meetingToken - The token of the meeting, for rooms that admit meetings only.
 * @param headless - Whether this client is a headless recorder page, kept out of the participants.
 * @param botType - What kind of bot the headless page is (recorder, transcriber, streamer).
 * @param botSession - The breakout session a bot is sent to; the main room when absent.
 * @param botId - The bot a provider started this page as.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, reconnectKey: string, token: string | undefined, meetingToken?: string, headless = false, botType?: string, botSession?: string, botId?: string): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const tenantFqdn = encodeURIComponent(window.location.hostname);
	const port = import.meta.env.PROD ? edumeetConfig.productionPort : edumeetConfig.developmentPort;

	let tokenParam = '';

	if (token) tokenParam = `&token=${token}`;
	if (meetingToken) tokenParam += `&meetingToken=${encodeURIComponent(meetingToken)}`;
	if (headless) tokenParam += '&headless=1';
	if (headless && botType) tokenParam += `&botType=${encodeURIComponent(botType)}`;
	if (headless && botSession) tokenParam += `&session=${encodeURIComponent(botSession)}`;
	if (headless && botId) tokenParam += `&botId=${encodeURIComponent(botId)}`;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}&reconnectKey=${reconnectKey}&tenantFqdn=${tenantFqdn}${tokenParam}`;
};

export class SocketTimeoutError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SocketTimeoutError';
		this.stack = (new Error(message)).stack;
	}
}
