import { describe, expect, it } from 'vitest';
import { chooseSendCodec, isProtectableCodec } from './codecChoice';

const h264 = { mimeType: 'video/H264', clockRate: 90000 };
const vp8 = { mimeType: 'video/VP8', clockRate: 90000 };
const vp9 = { mimeType: 'video/VP9', clockRate: 90000 };
const av1 = { mimeType: 'video/AV1', clockRate: 90000 };
const opus = { mimeType: 'audio/opus', clockRate: 48000 };
const pcmu = { mimeType: 'audio/PCMU', clockRate: 8000 };

describe('isProtectableCodec', () => {
	it('accepts Opus, VP8 and VP9 in any case', () => {
		expect(isProtectableCodec('audio/opus')).toBe(true);
		expect(isProtectableCodec('video/VP8')).toBe(true);
		expect(isProtectableCodec('video/vp9')).toBe(true);
		expect(isProtectableCodec('VIDEO/VP8')).toBe(true);
	});

	it('refuses everything the worker has no clear byte layout for', () => {
		expect(isProtectableCodec('video/H264')).toBe(false);
		expect(isProtectableCodec('video/AV1')).toBe(false);
		expect(isProtectableCodec('audio/PCMU')).toBe(false);
		expect(isProtectableCodec(undefined)).toBe(false);
		expect(isProtectableCodec('')).toBe(false);
	});

	it('matches the whole mime type, not a prefix or suffix', () => {
		expect(isProtectableCodec('video/vp8x')).toBe(false);
		expect(isProtectableCodec('xvideo/vp8')).toBe(false);
	});
});

describe('chooseSendCodec without encryption', () => {
	it('returns the codec that was asked for, by lower case mime type', () => {
		expect(chooseSendCodec([ h264, vp8, vp9 ], { e2ee: false, kind: 'video', requested: 'video/vp9' })).toBe(vp9);
		expect(chooseSendCodec([ opus, pcmu ], { e2ee: false, kind: 'audio', requested: 'audio/opus' })).toBe(opus);
	});

	it('returns nothing when nothing was asked for, leaving negotiation to decide', () => {
		expect(chooseSendCodec([ h264, vp8, vp9 ], { e2ee: false, kind: 'video' })).toBeUndefined();
	});

	it('returns nothing when the requested codec is not offered', () => {
		expect(chooseSendCodec([ h264, vp8 ], { e2ee: false, kind: 'video', requested: 'video/vp9' })).toBeUndefined();
	});

	it('copes with no capabilities at all', () => {
		expect(chooseSendCodec(undefined, { e2ee: false, kind: 'video', requested: 'video/vp8' })).toBeUndefined();
	});
});

describe('chooseSendCodec with encryption', () => {
	it('prefers the first protectable video codec even when H264 is offered first', () => {
		expect(chooseSendCodec([ h264, vp8, vp9 ], { e2ee: true, kind: 'video' })).toBe(vp8);
		expect(chooseSendCodec([ h264, vp9, vp8 ], { e2ee: true, kind: 'video' })).toBe(vp9);
	});

	it('overrides a request for a codec it cannot protect', () => {
		expect(chooseSendCodec([ h264, vp8 ], { e2ee: true, kind: 'video', requested: 'video/h264' })).toBe(vp8);
	});

	it('returns nothing when no video codec can be protected, so negotiation is refused afterwards', () => {
		const chosen = chooseSendCodec([ h264, av1 ], { e2ee: true, kind: 'video' });

		expect(chosen).toBeUndefined();
		expect(isProtectableCodec(h264.mimeType)).toBe(false);
	});

	it('leaves audio to the requested codec, as without encryption', () => {
		expect(chooseSendCodec([ pcmu, opus ], { e2ee: true, kind: 'audio', requested: 'audio/opus' })).toBe(opus);
		expect(chooseSendCodec([ pcmu, opus ], { e2ee: true, kind: 'audio' })).toBeUndefined();
	});

	it('never picks an audio codec for a video track from a real, mixed capabilities list', () => {
		const rtx = { mimeType: 'video/rtx', clockRate: 90000 };
		const routerOrdered = [ opus, vp8, rtx, vp9, rtx, h264, rtx ];

		expect(chooseSendCodec(routerOrdered, { e2ee: true, kind: 'video' })).toBe(vp8);
		expect(chooseSendCodec([ opus, h264, vp9 ], { e2ee: true, kind: 'video' })).toBe(vp9);
		expect(chooseSendCodec([ opus, h264, av1 ], { e2ee: true, kind: 'video' })).toBeUndefined();
	});

	it('returns the offered object itself, so negotiation parameters travel with it', () => {
		const chosen = chooseSendCodec([ h264, vp8 ], { e2ee: true, kind: 'video' });

		expect(chosen).toBe(vp8);
		expect(chosen?.clockRate).toBe(90000);
	});
});
