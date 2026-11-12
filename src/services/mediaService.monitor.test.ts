import EventEmitter from 'events';
import { describe, expect, it, vi } from 'vitest';
import type { ClientMonitor } from '@observertc/client-monitor-js';
import type { SignalingService } from './signalingService';

import { MediaService } from './mediaService';

vi.mock('@observertc/client-monitor-js', () => ({}));
vi.mock('../store/store', () => ({}));
vi.mock('../utils/edumeetConfig', () => ({ default: { theme: {} } }));

const setup = () => {
	const signalingService = Object.assign(new EventEmitter(), { notify: vi.fn(), sendRequest: vi.fn() });
	const monitor = Object.assign(new EventEmitter(), { removeSource: vi.fn() });

	const mediaService = new MediaService({ signalingService: signalingService as unknown as SignalingService }, monitor as unknown as ClientMonitor);

	const addPeerConnection = () => {
		const peerConnectionMonitor = Object.assign(new EventEmitter(), { issues: { resolveAll: vi.fn() } });

		monitor.emit('new-peerconnnection-monitor', { peerConnectionMonitor });

		return peerConnectionMonitor;
	};

	return { mediaService, addPeerConnection };
};

describe('MediaService client monitor peer connections', () => {
	it('resolves the issues of a peer connection once it closes', () => {
		const { addPeerConnection } = setup();
		const peerConnection = addPeerConnection();

		expect(peerConnection.issues.resolveAll).not.toHaveBeenCalled();

		peerConnection.emit('close');

		expect(peerConnection.issues.resolveAll).toHaveBeenCalledTimes(1);
		expect(peerConnection.issues.resolveAll).toHaveBeenCalledWith('peer connection closed');
	});

	it('leaves the other peer connections alone', () => {
		const { addPeerConnection } = setup();
		const closed = addPeerConnection();
		const open = addPeerConnection();

		closed.emit('close');

		expect(open.issues.resolveAll).not.toHaveBeenCalled();
	});
});
