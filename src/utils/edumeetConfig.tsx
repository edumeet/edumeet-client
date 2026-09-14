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

export default {
	...defaultEdumeetConfig,
	...windowConfig,
	theme: { ...defaultEdumeetConfig.theme, ...windowConfig.theme },
	clientMonitor: resolveClientMonitorConfig(),
};