// The management server's callback page posts the access token to the window that opened it.
// Any page can open that callback page with a code of its own account and then navigate to
// eduMEET, so a message from the right origin alone does not mean this page asked for it
// (login CSRF: the victim would be signed in to someone else's account). A token is taken
// only from the tab that login() opened, once, while that sign-in is pending.

const PENDING_FOR_MS = 15 * 60 * 1000;

let pending: { tab: Window; until: number } | undefined;

export const expectLoginFrom = (tab: Window): void => {
	pending = { tab, until: Date.now() + PENDING_FOR_MS };
};

export const loginAbandoned = (tab: Window): void => {
	if (pending?.tab === tab) pending = undefined;
};

export interface LoginMessage {
	token: string;
	idToken?: string;
}

export const acceptLoginMessage = (
	{ data, origin, source }: Pick<MessageEvent, 'data' | 'origin' | 'source'>,
	managementUrl: string | undefined
): LoginMessage | undefined => {
	if (data?.type !== 'edumeet-login' || !managementUrl) return;
	if (origin !== new URL(managementUrl).origin) return;
	if (!pending || source !== pending.tab || Date.now() > pending.until) return;

	const { data: token, idToken } = data;

	if (typeof token !== 'string' || !token) return;
	if (idToken !== undefined && typeof idToken !== 'string') return;

	pending = undefined;

	return { token, idToken };
};
