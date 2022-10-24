/* eslint-disable no-unused-vars */

export interface SocketMessage {
	method: string; // TODO: define inbound notification method strings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any; // TODO: define inbound notification data
}

export interface SignalingInterface {
	// Outbound messages
	notify: (notification: SocketMessage) => Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	request: (request: SocketMessage) => Promise<unknown>;
	close: () => void;
}