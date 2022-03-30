import EventEmitter from 'events';
import { Transport } from 'mediasoup-client/lib/Transport';
import { Logger } from '../utils/logger';

const logger = new Logger('PerformanceService');

export class PerformanceService extends EventEmitter {
	constructor() {
		super();

		logger.debug('constructor()');
	}

	monitorTransport(transport: Transport): void {
		logger.debug('monitorTransport() [id:%s]', transport.id);

		transport.observer.once('close', () => {
			logger.debug('monitorTransport() transport closed [id:%s]', transport.id);
		});
	}
}