import createCache, { type EmotionCache, type StylisPlugin } from '@emotion/cache';
import type { Theme } from '@mui/material/styles';

let plugins: StylisPlugin[] | undefined;
let cache: EmotionCache | undefined;

// Loaded only when a right-to-left language is chosen, so other users never download it.
export const loadRtlSupport = async (): Promise<void> => {
	if (plugins) return;

	const [ { prefixer }, { default: rtlPlugin } ] = await Promise.all([
		import('stylis'),
		import('stylis-plugin-rtl'),
	]);

	plugins = [ prefixer, rtlPlugin ];
	cache = createCache({ key: 'muirtl', stylisPlugins: plugins });
};

export const rtlStylisPlugins = (): StylisPlugin[] | undefined => plugins;

export const rtlCache = (): EmotionCache | undefined => cache;

export const mirrorInRtl = (theme: Theme): { transform?: string } =>
	(theme.direction === 'rtl' ? { transform: 'scaleX(-1)' } : {});
