import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = process.env.NODE_ENV !== 'production' ?
		edumeetConfig.developmentPort : edumeetConfig.productionPort;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}`;
};