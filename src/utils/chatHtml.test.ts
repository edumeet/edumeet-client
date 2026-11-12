// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { chatMessageHtml } from './chatHtml';

const anchors = (html: string): HTMLAnchorElement[] => {
	const div = document.createElement('div');

	div.innerHTML = html;

	return [ ...div.querySelectorAll('a') ];
};

describe('chat message links', () => {
	test.each([
		'<a href="https://example.org" target="slides">Slides</a>',
		'<a href="https://example.org" target="_top" rel="opener">x</a>',
		'<a href="https://example.org">x</a>',
		'[Slides](https://example.org)',
		'https://example.org',
	])('open in a new tab without opener: %s', (text) => {
		const [ a ] = anchors(chatMessageHtml(text));

		expect(a).toBeDefined();
		expect(a.getAttribute('target')).toBe('_blank');
		expect(a.getAttribute('rel')).toBe('noopener noreferrer');
		expect(a.getAttribute('href')).toBe('https://example.org');
	});

	test('keep markdown inside the link text and the title', () => {
		const [ a ] = anchors(chatMessageHtml('[**bold** link](https://example.org "Title")'));

		expect(a.querySelector('strong')?.textContent).toBe('bold');
		expect(a.getAttribute('title')).toBe('Title');
	});

	test('cannot break out of the attributes', () => {
		const html = chatMessageHtml('[x](https://example.org/"onmouseover="alert(1))');

		const [ a ] = anchors(html);

		expect(a.hasAttribute('onmouseover')).toBe(false);
		expect(a.getAttribute('target')).toBe('_blank');
	});

	test('script and event handlers are removed', () => {
		const html = chatMessageHtml('<img src=x onerror=alert(1)><script>alert(1)</script><a href="javascript:alert(1)">x</a>');

		expect(html).not.toMatch(/onerror|<script|javascript:/);
	});
});
