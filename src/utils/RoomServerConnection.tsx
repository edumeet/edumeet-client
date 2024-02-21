import { Logger, SocketMessage, SocketTimeoutError, skipIfClosed } from 'edumeet-common';
import EventEmitter from 'events';
import { io, Socket } from 'socket.io-client';

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
	public id: string|undefined;

	public static create({ url }: { url: string}): RoomServerConnection {
		logger.debug('create() [url:%s]', url);
	
		const socket = io(url, {
			transports: [ 'websocket', 'polling' ],
			rejectUnauthorized: true,
			closeOnBeforeunload: false,
			reconnection: false
		});
	
		return new RoomServerConnection(socket);
	}

	public closed = false;
	private socket: Socket<ClientServerEvents, ServerClientEvents>;

	constructor(socket: Socket<ClientServerEvents, ServerClientEvents>) {
		super();

		logger.debug('constructor()');

		this.socket = socket;
		this.id = socket.id;
		this.handleSocket();
	}

	@skipIfClosed
	public close(): void {
		logger.debug('close() [id: %s]', this.id);

		this.closed = true;

		if (this.socket.connected)
			this.socket.disconnect();
		this.socket.io.off();

		this.socket.removeAllListeners();

		this.emit('close');
	}

	@skipIfClosed
	public notify(notification: SocketMessage): void {
		logger.debug('notification() [notification: %o]', notification);

		this.socket.emit('notification', notification);
	}

	@skipIfClosed
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

	@skipIfClosed
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
	}

	private handleSocket(): void {
		logger.debug('handleSocket()');

		this.socket.on('connect', () => {
			logger.debug('handleSocket() connected');

			this.emit('connect');
		});

		this.socket.once('disconnect', () => {
			logger.debug('socket disconnected');
			this.close();
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