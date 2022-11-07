/* eslint-disable no-unused-vars */
import { EventEmitter } from 'events';
import { SignalingInterface, SocketMessage } from './SignalingInterface';

export type InboundRequest = (
	request: SocketMessage,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	respond: (response: any) => void,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reject: (error: any) => void
) => void;

export declare interface BaseConnection {
	// Connection events
	on(event: 'close', listener: () => void): this;
	on(event: 'connect', listener: () => void): this;
	on(event: 'reconnect', listener: (attempt: number) => void): this;

	// Inbound messages
	on(
		event: 'notification',
		listener: (
			notification: SocketMessage
		) => void): this;
	on(
		event: 'request',
		listener: InboundRequest): this;
}

/**
 * Base class for all connections (SocketIO/DataChannel etc.).
 */
export abstract class BaseConnection
	extends EventEmitter implements SignalingInterface {
	public abstract notify(notification: SocketMessage): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public abstract request(request: SocketMessage): Promise<unknown>;
	public abstract close(): void;
	public abstract get id(): string;
	public outgoing = false;
}