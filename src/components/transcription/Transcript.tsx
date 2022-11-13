import { styled } from '@mui/material/styles';

export default styled('div')(({ theme }) => ({
	background: 'grey',
	opacity: 0.75,
	color: 'white',
	fontWeight: 'bold',
	paddingLeft: theme.spacing(1),
	paddingRight: theme.spacing(1),
}));