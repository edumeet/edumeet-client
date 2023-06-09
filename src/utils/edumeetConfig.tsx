import { defaultEdumeetConfig, EdumeetConfig } from './types';

declare module '@mui/material/styles' {
	interface Theme {
		backgroundImage?: string;
		background?: string;
		appBarColor: string;
		appBarFloating: boolean;
		logo: string;
		activeSpeakerBorder: string;
		videoBackroundColor: string;
		videoShadow: string;
		videoAvatarImage: string;
		videoRoundedCorners: boolean;
		chatColor?: string;
	}

	interface ThemeOptions {
		backgroundImage?: string;
		background?: string;
		appBarColor?: string;
		appBarFloating?: boolean;
		logo?: string;
		activeSpeakerBorder?: string;
		videoBackroundColor?: string;
		videoShadow?: string;
		videoAvatarImage?: string;
		videoRoundedCorners?: boolean;
		chatColor?: string;
	}
}

declare global {
	interface Window {
		config?: Partial<EdumeetConfig>;
	}
}

export default {
	...defaultEdumeetConfig,
	...window.config,
	theme: { ...defaultEdumeetConfig.theme, ...window.config?.theme },
	observertc: { ...defaultEdumeetConfig.observertc, ...window.config?.observertc }
};