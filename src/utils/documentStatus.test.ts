import { describe, expect, it, vi } from 'vitest';

vi.mock('../store/hooks', () => ({ useAppSelector: vi.fn() }));

import { applyDocumentStatus, documentStatus } from './documentStatus';
import { RootState } from '../store/store';

const state = (room: Record<string, unknown>, signaling: Record<string, unknown>): RootState =>
	({ room, signaling } as unknown as RootState);

class FakeElement {
	attributes = new Map<string, string>();
	setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
	removeAttribute(name: string): void { this.attributes.delete(name); }
}

describe('documentStatus', () => {
	it('reports the room state, the connection state and the leave reason', () => {
		expect(documentStatus(state({ state: 'joined', leaveReason: undefined }, { state: 'connected' }))).toEqual({
			'data-edumeet-state': 'joined',
			'data-edumeet-connection': 'connected',
			'data-edumeet-reason': undefined,
		});
	});

	it('carries nothing but the three codes', () => {
		const status = documentStatus(state({ state: 'left', leaveReason: 'kicked', roomId: 'secret', logo: 'x' }, { state: 'disconnected', url: 'wss://x?token=y' }));

		expect(Object.keys(status)).toEqual([ 'data-edumeet-state', 'data-edumeet-connection', 'data-edumeet-reason' ]);
		expect(JSON.stringify(status)).not.toContain('secret');
		expect(JSON.stringify(status)).not.toContain('token');
	});
});

describe('applyDocumentStatus', () => {
	it('sets the attributes and removes the ones without a value', () => {
		const root = new FakeElement();

		applyDocumentStatus(root as unknown as Element, { 'data-edumeet-state': 'lobby', 'data-edumeet-connection': 'connected', 'data-edumeet-reason': undefined });
		expect(root.attributes.get('data-edumeet-state')).toBe('lobby');
		expect(root.attributes.has('data-edumeet-reason')).toBe(false);

		applyDocumentStatus(root as unknown as Element, { 'data-edumeet-state': 'left', 'data-edumeet-connection': 'disconnected', 'data-edumeet-reason': 'kicked' });
		expect(root.attributes.get('data-edumeet-reason')).toBe('kicked');
	});
});
