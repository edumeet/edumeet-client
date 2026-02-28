import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param reconnectKey - The reconnectKey of the client.
 * @param token - The token of the user.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, reconnectKey: string, token: string | undefined): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const tenantFqdn = encodeURIComponent(window.location.hostname);
	const port = import.meta.env.PROD ? edumeetConfig.productionPort : edumeetConfig.developmentPort;

	let tokenParam = '';

	if (token) tokenParam = `&token=${token}`;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}&reconnectKey=${reconnectKey}&tenantFqdn=${tenantFqdn}${tokenParam}`;
};

export class SocketTimeoutError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SocketTimeoutError';
		this.stack = (new Error(message)).stack;
	}
}
