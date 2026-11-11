import DOMPurify from 'dompurify';
import { marked } from 'marked';

const ALLOWED_TAGS = [ 'a', 'b', 'strong', 'i', 'em', 'u', 'strike', 'p', 'br' ];
// No target or rel from the sender: they are set below.
const ALLOWED_ATTR = [ 'href', 'title' ];

// An instance of its own, so the hook applies to chat messages only.
const purifier = DOMPurify(window);

// Chat messages come from other participants. A link that opens a named window or keeps
// window.opener lets the page it opens replace the meeting tab (reverse tabnabbing), so every
// link, markdown or raw HTML, opens in a new tab without opener or referrer.
purifier.addHook('afterSanitizeAttributes', (node) => {
	if (node.tagName === 'A') {
		node.setAttribute('target', '_blank');
		node.setAttribute('rel', 'noopener noreferrer');
	}
});

const renderer = new marked.Renderer();

renderer.link = ({ href, title, tokens }) => {
	// marked >= 16 passes the raw token; the label must be parsed so that inline markdown
	// inside the link text still renders. Attributes are escaped here and sanitized below.
	const label = renderer.parser.parseInline(tokens) || href;
	const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
		.replace(/</g, '&lt;');

	return `<a href="${escape(href)}" title="${escape(title || href)}">${label}</a>`;
};

export const chatMessageHtml = (text: string): string =>
	purifier.sanitize(marked.parse(text, { renderer, async: false }) as string, { ALLOWED_TAGS, ALLOWED_ATTR });
