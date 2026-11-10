// A room's background and logo are chosen by whoever owns the room and shown to everyone in
// it; the background goes into the page's CSS. Only a plain http(s) URL, a path or a base64
// image is used, without the characters that can end url() or a CSS rule.
const MAX_URL_LENGTH = 2048;
const CSS_BREAKING = /[\s"'()<>{};\\]/;
const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp|avif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export const safeImageUrl = (value: unknown): string | undefined => {
	if (typeof value !== 'string' || value === '') return undefined;
	if (DATA_IMAGE.test(value)) return value;
	if (value.length > MAX_URL_LENGTH || CSS_BREAKING.test(value)) return undefined;

	try {
		const url = new URL(value, globalThis.location?.href);

		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
	} catch {
		return undefined;
	}
};

// A CSS url() whose content cannot end the string it is in.
export const cssUrl = (value: string): string =>
	`url("${value.replace(/["\\\n\r\f]/g, (char) => encodeURIComponent(char))}")`;
