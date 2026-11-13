import { describe, expect, it, vi } from 'vitest';

const io = vi.hoisted(() => vi.fn(() => ({ id: 'socket', on: vi.fn(), io: { on: vi.fn() } })));

vi.mock('socket.io-client', () => ({ io }));
vi.mock('./edumeetConfig', () => ({ default: { theme: {} } }));

import { RoomServerConnection } from './RoomServerConnection';

describe('the connection to the room server', () => {
	it('uses WebSocket only, the one transport the room server takes', async () => {
		await RoomServerConnection.create({ getUrl: () => 'wss://room.example.org' });

		expect(io).toHaveBeenCalledWith('wss://room.example.org', expect.objectContaining({ transports: [ 'websocket' ] }));
	});
});
