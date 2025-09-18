import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

export const HoverBox = styled(Box)<{ hovered: boolean }>(({ hovered }) => ({
	overflowY: 'auto',
	opacity: hovered ? 1 : 0,
	position: 'absolute',
	top: 0,
	right: '-18px',
}));
