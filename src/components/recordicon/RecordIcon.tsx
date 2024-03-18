import { styled } from '@mui/material';
import { memo } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default memo(styled(FiberManualRecordIcon)({
	'&': {
		animation: 'blink 1.5s ease-in-out infinite'
	},
	'@keyframes blink': {
		from: { opacity: 1 },
		to: { opacity: 0 },
	}
}));
