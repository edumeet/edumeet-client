import { Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';

export default styled(Dialog)(({ theme }) => ({
	'.MuiDialog-paper': {
		width: '100vw',
		padding: theme.spacing(2),
	}
}));