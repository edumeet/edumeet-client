import { styled } from '@mui/material/styles';
import { memo } from 'react';

interface BackgroundProps {
	backgroundimage?: string;
}

export default memo(styled('div')<BackgroundProps>(({ theme, backgroundimage }) => ({
	display: 'flex',
	width: '100%',
	height: '100%',
	background: theme.background,
	...(backgroundimage && {
		backgroundImage: `url(${backgroundimage})`
	}),
	backgroundAttachment: 'fixed',
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	backgroundRepeat: 'no-repeat'
})));