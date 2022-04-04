import { defaultEdumeetConfig, EdumeetConfig } from './types';

declare module '@mui/material/styles' {
	interface Theme {
		backgroundImage: string;
		appBarColor: string;
		logo: string;
		activeSpeakerBorder: string;
		peerBackroundColor: string;
		peerShadow: string;
		peerAvatar: string;
	}

	interface ThemeOptions {
		backgroundImage?: string;
		appBarColor?: string;
		logo?: string;
		activeSpeakerBorder?: string;
		peerBackroundColor?: string;
		peerShadow?: string;
		peerAvatar?: string;
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
	theme: { ...defaultEdumeetConfig.theme, ...window.config?.theme }
};