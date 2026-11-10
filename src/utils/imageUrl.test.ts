import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cssUrl, safeImageUrl } from './imageUrl';

describe('safeImageUrl', () => {
	beforeEach(() => vi.stubGlobal('location', new URL('https://rooms.example.org/room1')));
	afterEach(() => vi.unstubAllGlobals());

	it('keeps http(s) URLs, paths and base64 images', () => {
		expect(safeImageUrl('https://cdn.example.org/bg.jpg')).toBe('https://cdn.example.org/bg.jpg');
		expect(safeImageUrl('http://x.example/a.png?size=2&v=1#top')).toBe('http://x.example/a.png?size=2&v=1#top');
		expect(safeImageUrl('/images/bg.jpg')).toBe('https://rooms.example.org/images/bg.jpg');
		expect(safeImageUrl('images/bg.jpg')).toBe('https://rooms.example.org/images/bg.jpg');
		expect(safeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
	});

	it('drops anything that could end url() or a CSS rule, and other schemes', () => {
		for (const value of [
			'x);}body{display:none}.a{',
			'https://x.example/a b.png',
			'https://x.example/a"b.png',
			'https://x.example/a(1).png',
			'javascript:alert(1)',
			'data:text/html;base64,PHNjcmlwdD4=',
			'data:image/png;base64,abc)}',
			`https://x.example/${'a'.repeat(2100)}`,
			'',
			42,
			undefined
		]) expect(safeImageUrl(value), String(value)).toBeUndefined();
	});
});

describe('cssUrl', () => {
	it('quotes the URL so its content cannot end the string', () => {
		expect(cssUrl('https://x.example/bg.jpg')).toBe('url("https://x.example/bg.jpg")');
		expect(cssUrl('blob:https://x.example/1"); } body { display: none')).toBe('url("blob:https://x.example/1%22); } body { display: none")');
		expect(cssUrl('a\\b\nc')).toBe('url("a%5Cb%0Ac")');
	});
});
