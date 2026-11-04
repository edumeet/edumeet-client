import EventEmitter from 'events';
import { describe, expect, it } from 'vitest';
import { SignalingService } from './signalingService';
import type { RoomServerConnection } from '../utils/RoomServerConnection';

class FakeConnection extends EventEmitter {
	public closed = false;

	close() {
		if (this.closed) return;
		this.closed = true;
		this.emit('close');
	}
}

const withConnections = (count: number) => {
	const service = new SignalingService();
	const connections = Array.from({ length: count }, () => new FakeConnection());

	connections.forEach((c) => service.addConnection(c as unknown as RoomServerConnection));

	return { service, connections };
};

describe('closing every signaling connection', () => {
	it('disconnect() closes all of them, not every other one', () => {
		const { service, connections } = withConnections(3);

		service.disconnect();

		expect(connections.map((c) => c.closed)).toEqual([ true, true, true ]);
		expect(service.connections.length).toBe(0);
	});

	it('close() closes all of them, not every other one', () => {
		const { service, connections } = withConnections(2);

		service.close();

		expect(connections.map((c) => c.closed)).toEqual([ true, true ]);
		expect(service.connections.length).toBe(0);
	});
});
