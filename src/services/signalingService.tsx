import EventEmitter from 'events';
import { InboundNotification, InboundRequest, SocketMessage } from '../utils/types';
import { RoomServerConnection } from '../utils/RoomServerConnection';
import { Logger } from '../utils/Logger';
import { List } from '../utils/List';

/* eslint-disable no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface SignalingService {
	on(event: 'connected', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
	on(event: 'close', listener: () => void): this;
	on(event: 'notification', listener: InboundNotification): this;
	on(event: 'request', listener: InboundRequest): this;
}
/* eslint-enable no-unused-vars */

const logger = new Logger('SignalingService');

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SignalingService extends EventEmitter {
	public closed = false;
	public connections = List<RoomServerConnection>();
	private connected = false;

	constructor() {
		super();

		this.setMaxListeners(Infinity);
	}

	public close(): void {
		if (this.closed) return;

		logger.debug('close()');

		this.closed = true;

		this.connections.items.forEach((c) => c.close());
		this.connections.clear();

		this.emit('close');
	}

	public disconnect(): void {
		logger.debug('disconnect()');

		this.connections.items.forEach((c) => c.close());
		this.connections.clear();
	}

	public addConnection(connection: RoomServerConnection): void {
		logger.debug('addConnection()');

		this.connections.add(connection);

		connection.on('notification', (notification) => {
			logger.debug('notification received [method: %s]', notification.method);

			this.emit('notification', notification);
		});

		connection.on('request', (request, respond, reject) => {
			logger.debug('request received [method: %s]', request.method);

			this.emit('request', request, respond, reject);
		});

		connection.on('error', (error) => {
			logger.debug('socket error event: %o', error);
			this.emit('error', error);
		});

		connection.on('connect', () => {
			logger.debug('socket connect event');

			if (!this.connected)
				this.emit('connected');

			this.connected = true;
		});

		connection.once('close', () => {
			logger.debug('socket close event');
			this.connections.remove(connection);

			if (this.connections.length === 0)
				this.connected = false;

			this.emit('close');
		});
	}

	public notify(method: string, data: unknown = {}): void {
		logger.debug('notify() [method: %s]', method);

		for (const connection of this.connections.items) {
			try {
				return connection.notify({ method, data } as SocketMessage);
			} catch (error) {
				logger.error('notify() [error: %o]', error);
			}
		}

		logger.warn('notify() no connection available');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async sendRequest(method: string, data: unknown = {}): Promise<any> {
		logger.debug('request() [method: %s]', method);

		for (const connection of this.connections.items) {
			try {
				return await connection.request({ method, data });
			} catch (error) {
				logger.error('request() [error: %o]', error);
			}
		}

		logger.warn('request() no connection available');
	}
}
