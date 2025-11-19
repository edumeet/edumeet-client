import { styled } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { memo } from 'react';
import PulsingBadge from '../pulsingbadge/PulsingBadge';

interface SettingsBadgeProps {
    // eslint-disable-next-line
	onClick?: (event?: any) => void;
	size?: number;
	color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const BadgeIcon = styled(ExpandLessIcon)(() => ({
	fontSize: 16
}));

const StyledBadge = styled(PulsingBadge, {
	shouldForwardProp: (prop) => prop !== 'size',
})<{ size?: number }>(({ size = 20 }) => ({
	position: 'absolute',
	top: 8,
	right: 8,
	zIndex: 1100,
	'& .MuiBadge-badge': {
		borderRadius: '50%',
		width: size,
		height: size,
		minWidth: 'unset',
		padding: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
}));

function SettingsBadgeComponent({
	onClick,
	size = 20,
	color = 'primary',
}: SettingsBadgeProps): React.JSX.Element {
	return (
		<StyledBadge
			size={size}
			color={color}
			badgeContent={<BadgeIcon />}
			onClick={onClick}
		/>
	);
}

export default memo(SettingsBadgeComponent);