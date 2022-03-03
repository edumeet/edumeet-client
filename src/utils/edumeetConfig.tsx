import { defaultEdumeetConfig, EdumeetConfig } from './types';

declare global {
	interface Window {
		config?: Partial<EdumeetConfig>;
	}
}

export default { ...defaultEdumeetConfig, ...window.config };