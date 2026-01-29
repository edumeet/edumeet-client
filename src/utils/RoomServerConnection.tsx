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

export class RoomServerConnection extends EventEmitter {
	public id?: string;
	public closed = false;

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
			reconnectionAttempts: Infinity,
			reconnectionDelay: 500,
			reconnectionDelayMax: 5000,
			timeout: 10000
		});

		return new RoomServerConnection(socket, getUrl);
	}

	constructor(
		socket: Socket<ClientServerEvents, ServerClientEvents>,
		getUrl: () => string
	) {
		super();

		logger.debug('constructor()');

		this.socket = socket;
		this.getUrl = getUrl;
		this.id = socket.id;

		this.handleSocket();
	}

	public close(): void {
		logger.debug('close() [id: %s]', this.id);

		this.closed = true;

		if (this.socket.connected)
			this.socket.disconnect();

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

				return;
			}

			this.socket.timeout(8000).emit('request', socketMessage, (timeout, serverError, response) => {
				if (timeout)
					reject(new SocketTimeoutError('Request timed out'));
				else if (serverError)
					reject(serverError);
				else
					resolve(response);
			});
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
				} else {
					throw error;
				}
			}
		}

		// if failed 3 times exit meeting
		this.emit('close');
	}

	private handleSocket(): void {
		logger.debug('handleSocket()');

		this.socket.on('connect', () => {
			logger.debug('handleSocket() connected');

			if (this.socket.recovered)
				this.emit('reconnected');
			else
				this.emit('connect');
		});

		this.socket.on('disconnect', (reason: string) => {
			logger.debug('socket disconnected [reason:%s]', reason);
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
			this.emit('error', error);
		});

		this.socket.io.on('reconnect', (attempt: number) => {
			logger.debug('reconnect success [attempt:%s]', attempt);
		});

		this.socket.io.on('reconnect_error', (error: Error) => {
			logger.warn('reconnect_error [error:%o]', error);
		});

		this.socket.io.on('reconnect_attempt', () => {
			const nextUrl = this.getUrl();

			this.socket.io.uri = nextUrl;

			logger.debug('reconnect_attempt -> updated uri [uri:%s]', nextUrl);
		});
	}
}
