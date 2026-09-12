import { ClientMonitorConfig } from '@observertc/client-monitor-js';
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
 * `clientMontitor` is the original (misspelled) key and deployments still use
 * it, so it is honored with `clientMonitor` taking precedence. Key *presence*
 * is what matters, not truthiness: setting either key to undefined is how a
 * deployment disables monitoring entirely.
 *
 * The result is merged over the defaults, so a config that only sets
 * `samplingPeriodInMs` keeps the default collecting period instead of losing it
 * to a shallow overwrite.
 */
const resolveClientMonitorConfig = (): ClientMonitorConfig | undefined => {
	let configured = defaultEdumeetConfig.clientMonitor;

	if ('clientMontitor' in windowConfig) configured = windowConfig.clientMontitor;
	if ('clientMonitor' in windowConfig) configured = windowConfig.clientMonitor;

	if (!configured) return undefined;

	return { ...defaultEdumeetConfig.clientMonitor, ...configured };
};

export default {
	...defaultEdumeetConfig,
	...windowConfig,
	theme: { ...defaultEdumeetConfig.theme, ...windowConfig.theme },
	clientMonitor: resolveClientMonitorConfig(),
	// Consumed above - nothing else should read the legacy key.
	clientMontitor: undefined,
};