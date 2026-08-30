import { alpha, Theme } from '@mui/material';

export const directChatBackground = (theme: Theme): string =>
	alpha(theme.palette.primary.main, 0.18);

export const directChatHoverBackground = (theme: Theme): string =>
	alpha(theme.palette.primary.main, 0.3);
