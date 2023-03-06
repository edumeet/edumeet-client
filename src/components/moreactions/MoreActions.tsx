import { styled } from '@mui/material/styles';
import { memo } from 'react';

const MoreActions = styled('p')(({ theme }) => ({
	margin: theme.spacing(0.5, 0, 0.5, 1.5)
}));

export default memo(MoreActions);