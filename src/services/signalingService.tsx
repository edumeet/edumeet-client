/* eslint-disable no-unused-vars */
import { Logger } from '../utils/logger';
import { io, Socket } from 'socket.io-client';
import EventEmitter from 'events';
import { SocketTimeoutError } from '../utils/SocketTimeoutError';
import {
	ConnectWebRtcTransport,
	ConsumerData,
	CreateWebRtcTransport,
	JoinData,
	ProduceData,
	SocketInboundNotification,
	SocketOutboundRequest
} from '../utils/types';
import edumeetConfig from '../utils/edumeetConfig';

export declare interface SignalingService {
	// Signaling events
	on(event: 'connect', listener: () => void): this;
	on(event: 'disconnect', listener: () => void): this;
	on(event: 'reconnect', listener: (attempt: number) => void): this;
	on(event: 'reconnect_failed', listener: () => void): this;

	// General server messages
	on(event: 'notification', listener: (notification: SocketInboundNotification) => void): this;
}

interface ServerClientEvents {
	notification: ({ method, data }: SocketInboundNotification) => void;
}

interface ClientServerEvents {
	request: ({	method,	data }: SocketOutboundRequest,
		response: (
			error: Error,
			resonse: any
		) => void
	) => void;
}

const logger = new Logger('SignalingService');

export class SignalingService extends EventEmitter {
	private socket?: Socket<ServerClientEvents, ClientServerEvents>;

	constructor() {
		super();
		logger.debug('constructor()');
	}

	connect({ url }: { url: string}): void {
		logger.debug('connect() [url:%s]', url);

		this.socket = io(url);
		this._handleSocket();
	}

	_handleSocket(): void {
		this.socket?.on('notification', (notification) => {
			this.emit('notification', notification);
		});

		this.socket?.on('connect', () => {
			logger.debug('_handleSocket() | connected');

			this.emit('connect');
		});

		this.socket?.on('disconnect', (reason) => {
			logger.debug('_handleSocket() | disconnected [reason:%s]', reason);

			if (
				reason === 'io server disconnect' ||
				reason === 'io client disconnect'
			) {
				logger.debug('_handleSocket() | purposefully disconnected');

				this.emit('disconnect');
			} else {
				this.emit('reconnect');
			}
		});
	}

	_sendRequest(socketMessage: SocketOutboundRequest): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject('No socket connection');
			} else {
				this.socket.timeout(edumeetConfig.requestTimeout).emit('request', socketMessage, (error, response) => {
					if (error) reject(new SocketTimeoutError('Request timed out'));
					else resolve(response);
				});
			}
		});
	}

	async sendRequest(
		method: string,
		data?:
			CreateWebRtcTransport |
			ConnectWebRtcTransport |
			ProduceData |
			ConsumerData |
			JoinData |
			undefined,
	): Promise<any> {
		logger.debug('sendRequest() [method:%s, data:%o]', method, data);

		for (let tries = 0; tries < edumeetConfig.requestRetries; tries++) {
			try {
				return await this._sendRequest({ method, data });
			} catch (error) {
				if (
					error instanceof SocketTimeoutError &&
					tries < edumeetConfig.requestRetries
				)
					logger.warn('sendRequest() | timeout, retrying [attempt:%s]', tries);
				else
					throw error;
			}
		}
	}
}