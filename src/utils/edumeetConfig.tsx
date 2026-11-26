import { ClientMonitorConfig } from '@observertc/client-monitor-js';
import { ThemeOptions } from '@mui/material';
import { defaultEdumeetConfig, EdumeetConfig } from './types';

declare module '@mui/material/styles' {
	interface Theme {
		backgroundImage?: string;
		background?: string;
		appBarColor: string;
		appBarTextColor: string;
		appBarIconColor: string;
		appBarFloating: boolean;
		precallTitleColor: string;
		precallTitleTextColor: string;
		precallTitleIconColor: string;
		logo: string;
		appBarLogo?: string;
		activeSpeakerBorder: string;
		videoBackroundColor: string;
		videoAvatarImage: string;
		roundedness: number;
		sideContentItemColor?: string;
		sideContentItemDarkColor?: string;
		sideContainerBackgroundColor?: string;
	}

	interface ThemeOptions {
		backgroundImage?: string;
		background?: string;
		appBarColor?: string;
		appBarTextColor?: string;
		appBarIconColor?: string;
		appBarFloating?: boolean;
		precallTitleColor?: string;
		precallTitleTextColor?: string;
		precallTitleIconColor?: string;
		logo?: string;
		appBarLogo?: string;
		activeSpeakerBorder?: string;
		videoBackroundColor?: string;
		videoAvatarImage?: string;
		roundedness?: number;
		sideContentItemColor?: string;
		sideContentItemDarkColor?: string;
		sideContainerBackgroundColor?: string;
	}
}

declare global {
	interface Window {
		config?: Partial<EdumeetConfig>;
	}
}

const windowConfig: Partial<EdumeetConfig> = window.config ?? {};

/**
 * Resolves the client monitor configuration.
 *
 * Key *presence* is what matters, not truthiness: setting `clientMonitor` to
 * undefined is how a deployment disables monitoring entirely, while omitting
 * the key keeps the defaults.
 *
 * The result is merged over the defaults, so a config that only sets
 * `samplingPeriodInMs` keeps the default collecting period instead of losing it
 * to a shallow overwrite.
 */
const resolveClientMonitorConfig = (): ClientMonitorConfig | undefined => {
	const configured = 'clientMonitor' in windowConfig
		? windowConfig.clientMonitor
		: defaultEdumeetConfig.clientMonitor;

	if (!configured) return undefined;

	return { ...defaultEdumeetConfig.clientMonitor, ...configured };
};

/**
 * The default app bar is dark: a deployment that sets neither its own logo nor its own app bar
 * colour gets the light eduMEET logo there. Any other deployment keeps its logo in the app bar,
 * unless it sets appBarLogo.
 */
const resolveTheme = (): ThemeOptions => {
	const configured = windowConfig.theme ?? {};
	const theme = { ...defaultEdumeetConfig.theme, ...configured };
	const defaultLook = !configured.logo && !configured.appBarColor;

	const fallback = defaultLook ? 'images/logo.edumeet.light.svg' : theme.logo;

	return { ...theme, appBarLogo: configured.appBarLogo || fallback };
};

export default {
	...defaultEdumeetConfig,
	...windowConfig,
	theme: resolveTheme(),
	clientMonitor: resolveClientMonitorConfig(),
};