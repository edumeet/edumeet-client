import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param token - The token of the user.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, token: string | undefined): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const tenantFqdn = encodeURIComponent(window.location.hostname);
	const port = import.meta.env.PROD ? edumeetConfig.productionPort : edumeetConfig.developmentPort;
	const reconnectKey = crypto.randomUUID();
	const reconnectKeyParam = `&reconnectKey=${reconnectKey}`;

	let tokenParam = '';

	if (token) tokenParam = `&token=${token}`;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}&tenantFqdn=${tenantFqdn}${tokenParam}${reconnectKeyParam}`;
};

export class SocketTimeoutError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SocketTimeoutError';
		this.stack = (new Error(message)).stack;
	}
}
