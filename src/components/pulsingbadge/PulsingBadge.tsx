import { Badge, styled } from '@mui/material';
import { memo } from 'react';

export default memo(styled(Badge)(({ theme }) => ({
	badge: {
		backgroundColor: theme.palette.secondary.main,
		'&::after': {
			position: 'absolute',
			width: '100%',
			height: '100%',
			borderRadius: '50%',
			animation: 'ripple 1.2s infinite ease-in-out',
			border: `3px solid ${theme.palette.secondary.main}`,
			content: '""'
		}
	},
	'@keyframes ripple': {
		'0%': {
			transform: 'scale(.8)',
			opacity: 1
		},
		'100%': {
			transform: 'scale(2.4)',
			opacity: 0
		}
	}
})));