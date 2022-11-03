import { v4 as uuid } from 'uuid';

export interface RawSocketMessage {
	request?: true;
	response?: true;
	notification?: true;
	id: string;
	method?: string;
	data?: unknown;
	errorReason?: string;
}

export interface SentRequest {
	id: string;
	method?: string;
	// eslint-disable-next-line no-unused-vars
	resolve: (data: unknown) => void;
	// eslint-disable-next-line no-unused-vars
	reject: (error: unknown) => void;
	timer: NodeJS.Timeout;
	close: () => void;
}

export class RawSocket {
	public static parse(raw: string): RawSocketMessage | undefined {
		let message: RawSocketMessage;

		try {
			message = JSON.parse(raw);
		} catch (error) {
			return;
		}

		if (typeof message !== 'object' || Array.isArray(message))
			return;

		return message;
	}

	static createRequest(method: string, data: unknown): RawSocketMessage {
		return {
			request: true,
			id: uuid(),
			method: method,
			data: data ?? {}
		};
	}

	static createSuccessResponse(
		request: RawSocketMessage,
		data: unknown
	): RawSocketMessage {
		return {
			response: true,
			id: request.id,
			data: data ?? {}
		};
	}

	static createErrorResponse(
		request: RawSocketMessage,
		errorReason?: string
	): RawSocketMessage {
		return {
			response: true,
			id: request.id,
			errorReason: errorReason
		};
	}

	static createNotification(
		method: string,
		data: unknown
	): RawSocketMessage {
		return {
			notification: true,
			id: uuid(),
			method: method,
			data: data || {}
		};
	}
}