import { BaseConnection } from './BaseConnection';
import { SocketMessage } from './SignalingInterface';
import { Logger } from './logger';
import { SocketTimeoutError } from './SocketTimeoutError';
import { skipIfClosed } from './decorators';
import { RawSocket, RawSocketMessage, SentRequest } from './RawSocket';
import { DataProducer } from 'mediasoup-client/lib/DataProducer';
import { DataConsumer } from 'mediasoup-client/lib/DataConsumer';

const logger = new Logger('ProducerConnection');

export class ProducerConnection extends BaseConnection {
	public closed = false;
	public incoming = false;
	public outgoing = false;
	private sentRequests = new Map<string, SentRequest>();
	private incomingConsumer?: DataConsumer;
	private outgoingProducer: DataProducer;

	constructor(outgoingProducer: DataProducer) {
		super();

		logger.debug('constructor()');

		this.outgoingProducer = outgoingProducer;

		this.handleProducer();
	}

	@skipIfClosed
	public close(): void {
		logger.debug('close() [id: %s]', this.id);

		this.closed = true;

		this.sentRequests.forEach((r) => r.close());
		this.outgoingProducer.close();
		this.incomingConsumer?.close();

		this.emit('close');
	}

	public get id(): string {
		return this.outgoingProducer.id;
	}

	@skipIfClosed
	public notify(notification: SocketMessage): void {
		logger.debug('notification() [notification: %o]', notification);

		const rawNotification = RawSocket.createNotification(
			notification.method,
			notification.data
		);

		this.outgoingProducer.send(JSON.stringify(rawNotification));
	}

	@skipIfClosed
	private sendRequestOnWire(rawRequest: RawSocketMessage): Promise<unknown> {
		this.outgoingProducer.send(JSON.stringify(rawRequest));

		return new Promise((pResolve, pReject) => {
			const timeout = 1500 * (15 + (0.1 * this.sentRequests.size));
			const sent = {
				id: rawRequest.id,
				method: rawRequest.method,
				resolve: (data: unknown) => {
					if (!this.sentRequests.delete(rawRequest.id))
						return;

					clearTimeout(sent.timer);
					pResolve(data);
				},
				reject: (error: unknown) => {
					if (!this.sentRequests.delete(rawRequest.id))
						return;

					clearTimeout(sent.timer);
					pReject(error);
				},
				timer: setTimeout(() => {
					if (!this.sentRequests.delete(rawRequest.id))
						return;

					pReject(new SocketTimeoutError('request timeout'));
				}, timeout),
				close: () => {
					clearTimeout(sent.timer);
					pReject(new Error('transport closed'));
				}
			} as SentRequest;

			this.sentRequests.set(rawRequest.id, sent);
		});
	}

	@skipIfClosed
	public async request(request: SocketMessage): Promise<unknown> {
		logger.debug('sendRequest() [request: %o]', request);

		const rawRequest = RawSocket.createRequest(request.method, request.data);

		return await this.sendRequestOnWire(rawRequest);
	}

	private handleProducer(): void {
		if (this.outgoingProducer.readyState === 'open') this.outgoing = true;

		this.outgoingProducer.on('open', () => (this.outgoing = true));
		this.outgoingProducer.on('close', () => this.close());
	}

	public handleConnection(incomingConsumer: DataConsumer): void {
		logger.debug('handleConnection()');

		this.incomingConsumer = incomingConsumer;

		this.incomingConsumer.observer.once('close', () => {
			logger.debug('incomingConsumer "close" event');

			this.close();
		});

		this.incomingConsumer.on('message', (message) => {
			logger.debug('incomingConsumer "message" event [message: %s, ppid: %s]', message);

			const text = message.toString('utf8');

			try {
				const socketMessage = JSON.parse(text) as RawSocketMessage;

				if (socketMessage.request) {
					this.emit(
						'request',
						{
							method: socketMessage.method,
							data: socketMessage.data
						} as SocketMessage,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(response: any) => {
							const rawResponse =
								RawSocket.createSuccessResponse(socketMessage, response);

							this.outgoingProducer.send(JSON.stringify(rawResponse));
						},
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(error: any) => {
							const rawResponse =
								RawSocket.createErrorResponse(socketMessage, error);

							this.outgoingProducer.send(JSON.stringify(rawResponse));
						}
					);
				} else if (socketMessage.response) {
					const sent = this.sentRequests.get(socketMessage.id);

					if (!sent)
						return logger.warn('unknown response [id: %s]', socketMessage.id);

					if (socketMessage.errorReason)
						sent.reject(socketMessage.errorReason);
					else
						sent.resolve(socketMessage.data);
				} else if (socketMessage.notification) {
					this.emit(
						'notification',
						{
							method: socketMessage.method,
							data: socketMessage.data
						} as SocketMessage
					);
				}
			} catch (error) {
				logger.warn('"message" parsing [error: %o]', error);
			}
		});
	}
}