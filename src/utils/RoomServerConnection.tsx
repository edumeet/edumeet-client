import EventEmitter from 'events';
import { SocketMessage } from './types';
import { Logger } from './Logger';
import { SocketTimeoutError } from './signalingHelpers';
import type { Socket } from 'socket.io-client';

interface ClientServerEvents {
	/* eslint-disable no-unused-vars */
	notification: (notification: SocketMessage) => void;
	request: (request: SocketMessage, result: (
		serverError: unknown | null,
		responseData: unknown) => void
	) => void;
	/* eslint-enable no-unused-vars */
}

interface ServerClientEvents {
	/* eslint-disable no-unused-vars */
	notification: (notification: SocketMessage) => void;
	request: (request: SocketMessage, result: (
		timeout: Error | null,
		serverError: unknown | null,
		responseData: unknown) => void
	) => void;
	/* eslint-enable no-unused-vars */
}

const logger = new Logger('RoomServerConnection');

/* eslint-disable no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface RoomServerConnection {
	on(event: 'connect', listener: () => void): this;
	on(event: 'reconnected', listener: () => void): this;
	on(event: 'reconnecting', listener: (attempt: number) => void): this;
	on(event: 'disconnected', listener: (reason: string) => void): this;
	on(event: 'close', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
	on(event: 'notification', listener: (notification: SocketMessage) => void): this;
	on(event: 'request', listener: (request: SocketMessage, respond: (data: unknown) => void, reject: (error: unknown) => void) => void): this;
	once(event: 'close', listener: () => void): this;
}
/* eslint-enable no-unused-vars */

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RoomServerConnection extends EventEmitter {
	public id?: string;
	public closed = false;
	private isReconnecting = false;

	private socket: Socket<ClientServerEvents, ServerClientEvents>;
	private getUrl: () => string;

	public static async create({
		getUrl
	}: {
		getUrl: () => string
	}): Promise<RoomServerConnection> {
		const url = getUrl();

		logger.debug('create() [url:%s]', url);

		const { io } = await import('socket.io-client');

		const socket = io(url, {
			transports: [ 'websocket', 'polling' ],
			rejectUnauthorized: true,
			closeOnBeforeunload: false,
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 8000,
			randomizationFactor: 0.5,
		});

		return new RoomServerConnection(socket, getUrl);
	}

	constructor(socket: Socket<ClientServerEvents, ServerClientEvents>, getUrl: () => string) {
		super();

		logger.debug('constructor()');

		this.socket = socket;
		this.getUrl = getUrl;
		this.id = socket.id;
		this.handleSocket();
	}

	public close(): void {
		if (this.closed) return;

		logger.debug('close() [id: %s]', this.id);

		this.closed = true;

		if (this.socket.connected) {
			this.socket.disconnect();
		}

		this.socket.io.off();

		this.socket.removeAllListeners();

		this.emit('close');
	}

	public notify(notification: SocketMessage): void {
		logger.debug('notification() [notification: %o]', notification);

		this.socket.emit('notification', notification);
	}

	private sendRequestOnWire(socketMessage: SocketMessage): Promise<unknown> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject('No socket connection');
			} else {
				this.socket.timeout(1500).emit('request', socketMessage, (timeout, serverError, response) => {
					if (timeout) reject(new SocketTimeoutError('Request timed out'));
					else if (serverError) reject(serverError);
					else resolve(response);
				});
			}
		});
	}

	public async request(request: SocketMessage): Promise<unknown> {
		logger.debug('sendRequest() [request: %o]', request);

		for (let tries = 0; tries < 3; tries++) {
			try {
				return await this.sendRequestOnWire(request);
			} catch (error) {
				if (error instanceof SocketTimeoutError) {
					logger.warn('sendRequest() timeout, retrying [attempt: %s]', tries + 1);
					this.emit('error', new Error('Socket timeout'));
				} else
					throw error;
			}
		}

		// if failed 3 times exit meeting
		this.emit('close');
	}

	private handleSocket(): void {
		logger.debug('handleSocket()');

		this.socket.on('connect', () => {
			logger.debug('handleSocket() connected [recovered:%s, reconnecting:%s]',
				this.socket.recovered, this.isReconnecting);

			if (this.socket.recovered || this.isReconnecting) {
				this.isReconnecting = false;
				this.id = this.socket.id;
				this.emit('reconnected');
			} else {
				this.id = this.socket.id;
				this.emit('connect');
			}
		});

		this.socket.on('disconnect', (reason: string) => {
			logger.debug('socket disconnected [reason:%s]', reason);

			this.emit('disconnected', reason);
		});

		this.socket.io.on('reconnect_attempt', (attempt: number) => {
			logger.debug('socket reconnect attempt [attempt:%d]', attempt);

			this.isReconnecting = true;
			this.emit('reconnecting', attempt);
		});

		this.socket.io.on('reconnect_failed', () => {
			logger.debug('socket reconnect failed, giving up');

			this.emit('close');
		});

		this.socket.on('notification', (notification) => {
			logger.debug('"notification" event [notification: %o]', notification);

			this.emit('notification', notification);
		});

		this.socket.on('request', (request, result) => {
			logger.debug('"request" event [request: %o]', request);

			this.emit(
				'request',
				request,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(response: any) => result(null, response),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(error: any) => result(error, null)
			);
		});

		// Listen and re-transmit events from manager.
		this.socket.io.on('error', (error: Error) => {
			this.emit('error', (error));
		});
	}
}
