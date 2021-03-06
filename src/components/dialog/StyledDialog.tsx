import { Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';

export default styled(Dialog)(({ theme }) => ({
	'.MuiDialog-paper': {
		width: '30vw',
		padding: theme.spacing(2),
		[theme.breakpoints.down('lg')]: {
			width: '50vw'
		},
		[theme.breakpoints.down('md')]: {
			width: '70vw'
		},
		[theme.breakpoints.down('sm')]: {
			width: '90vw',
			margin: 0
		}
	}
}));