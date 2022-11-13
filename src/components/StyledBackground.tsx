import { styled } from '@mui/material/styles';

export default styled('div')(({ theme }) => ({
	display: 'flex',
	width: '100%',
	height: '100%',
	background: theme.background,
	...(theme.backgroundImage && {
		backgroundImage: `url(${theme.backgroundImage})`
	}),
	backgroundAttachment: 'fixed',
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	backgroundRepeat: 'no-repeat'
}));