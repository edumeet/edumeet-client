// A bot access token is minted and hashed in the admin's browser: the management
// server only ever stores the SHA-256, and the token itself exists on that one
// screen until it is copied into the recorder's configuration.
export const generateBotToken = (): string => {
	const bytes = new Uint8Array(32);

	crypto.getRandomValues(bytes);

	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/[=]+$/, '');
};

export const hashBotToken = async (token: string): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));

	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
// Loose on purpose: the management server checks with the real parser and reports
// the entries it refuses; this only catches obvious typos before the round trip.
const ipv6 = /^[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,7}(\.\d{1,3}(\.\d{1,3}){3})?$/i;

// "10.0.0.5", "10.0.0.0/8", "2001:db8::1" or "2001:db8::/32".
export const isAddressOrRange = (entry: string): boolean => {
	const [ address, prefix, ...rest ] = entry.trim().split('/');

	if (rest.length > 0 || !address) return false;

	const family = ipv4.test(address) ? 4 : ipv6.test(address) && address.includes(':') ? 6 : 0;

	if (family === 0) return false;
	if (prefix === undefined) return true;
	if (!/^\d{1,3}$/.test(prefix)) return false;

	return Number(prefix) <= (family === 4 ? 32 : 128);
};

// One entry per line or comma; blanks dropped.
export const parseRangeList = (text: string): string[] =>
	text.split(/[\n,]/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

export const invalidRanges = (entries: string[]): string[] => entries.filter((entry) => !isAddressOrRange(entry));
