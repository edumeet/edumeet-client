import edumeetConfig from './edumeetConfig';

export const getSignalingUrl = ({
	peerId,
	roomId
}: {
	peerId: string;
	roomId: string;
}): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = process.env.NODE_ENV !== 'production' ?
		edumeetConfig.developmentPort : edumeetConfig.productionPort;

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}`;
};