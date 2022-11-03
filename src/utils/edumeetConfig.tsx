import { MediaService } from '../services/mediaService';
import { defaultEdumeetConfig, EdumeetConfig } from './types';

declare module '@mui/material/styles' {
	interface Theme {
		backgroundImage?: string;
		background?: string;
		appBarColor: string;
		logo: string;
		activeSpeakerBorder: string;
		peerBackroundColor: string;
		peerShadow: string;
		peerAvatar: string;
		chatColor?: string;
	}

	interface ThemeOptions {
		backgroundImage?: string;
		background?: string;
		appBarColor?: string;
		logo?: string;
		activeSpeakerBorder?: string;
		peerBackroundColor?: string;
		peerShadow?: string;
		peerAvatar?: string;
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