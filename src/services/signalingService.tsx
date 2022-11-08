import { BaseConnection, InboundNotification, InboundRequest, List, Logger, skipIfClosed } from 'edumeet-common';
import EventEmitter from 'events';
import { SocketMessage } from '../utils/types';

/* eslint-disable no-unused-vars */
export declare interface SignalingService {
	on(event: 'connected', listener: () => void): this;
	on(event: 'close', listener: () => void): this;
	on(event: 'notification', listener: InboundNotification): this;
	on(event: 'request', listener: InboundRequest): this;
}
/* eslint-enable no-unused-vars */

const logger = new Logger('SignalingService');

export class SignalingService extends EventEmitter {
	public closed = false;
	public connections = List<BaseConnection>();
	private connected = false;

	@skipIfClosed
	public close(): void {
		logger.debug('close()');

		this.closed = true;

		this.connections.items.forEach((c) => c.close());
		this.connections.clear();

		this.emit('close');
	}

	@skipIfClosed
	public addConnection(connection: BaseConnection): void {
		logger.debug('addConnection()');

		this.connections.add(connection);

		connection.on('notification', async (notification) => {
			logger.debug('notification received [method: %s]', notification.method);

			this.emit('notification', notification);
		});

		connection.on('request', async (request, respond, reject) => {
			logger.debug('request received [method: %s]', request.method);

			this.emit('request', request, respond, reject);
		});

		connection.on('connect', () => {
			logger.debug('connect');

			if (!this.connected)
				this.emit('connect');

			this.connected = true;
		});

		connection.once('close', () => {
			this.connections.remove(connection);

			if (this.connections.length === 0)
				this.close();
		});
	}

	@skipIfClosed
	public notify(notification: SocketMessage): void {
		logger.debug('notify() [method: %s]', notification.method);

		for (const connection of this.connections.items) {
			try {
				return connection.notify(notification);
			} catch (error) {
				logger.error('notify() [error: %o]', error);
			}
		}

		logger.warn('notify() no connection available');
	}

	@skipIfClosed
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