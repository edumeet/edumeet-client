import { Dialog } from '@mui/material';
import { styled } from '@mui/material/styles';
import { memo } from 'react';

export default memo(styled(Dialog)(({ theme }) => ({
	'.MuiDialog-paper': {
		width: '100vw',
		padding: theme.spacing(2),
	}
})));