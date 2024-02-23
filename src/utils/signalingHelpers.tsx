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
export const getSignalingUrl = (peerId: string, roomId: string, tenantId: string | undefined, token: string | undefined): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = import.meta.env.PROD ? edumeetConfig.productionPort : edumeetConfig.developmentPort;

	let tenantParam = '';
	let tokenParam = '';

	if (tenantId) tenantParam = `&tenantId=${tenantId}`;
	if (token) tokenParam = `&token=${token}`;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}${tenantParam}${tokenParam}`;
};