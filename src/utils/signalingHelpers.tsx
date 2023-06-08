import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param tenantId - The id of the tenant.
 * @param token - The token of the user.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, tenantId: string, token: string | undefined): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = import.meta.env.NODE_ENV !== 'production' ?
		edumeetConfig.developmentPort : edumeetConfig.productionPort;

	let tokenParam = '';

	if (token) tokenParam = `&token=${token}`;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}&tenantId=${tenantId}${tokenParam}`;
};