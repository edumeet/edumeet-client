import { ReactNode } from 'react';
import { styled, SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';

interface VideoBoxProps {
	position?: 'relative' | 'absolute';
	width?: number;
	height?: number;
	margin?: number;
	order?: number;
	zIndex?: number;
	activeSpeaker?: boolean;
	children?: ReactNode;
	sx?: SxProps<Theme>;
}

type StyledVideoBoxProps = {
	position?: 'relative' | 'absolute';
	width?: number;
	height?: number;
	margin?: number;
	order?: number;
	zIndex?: number;
	activeSpeaker?: boolean;
};

const StyledVideoBox = styled(Box)<StyledVideoBoxProps>(({
	theme,
	position,
	height,
	width,
	margin,
	order,
	zIndex,
	activeSpeaker,
}) => ({
	position,
	width,
	height,
	margin: theme.spacing(margin || 0),
	order,
	zIndex,
	...(activeSpeaker && {
		border: theme.activeSpeakerBorder
	}),
	boxShadow: theme.peerShadow,
	backgroundColor: theme.peerBackroundColor,
	backgroundImage: `url(${theme.peerAvatar})`,
	backgroundPosition: 'bottom',
	backgroundSize: 'auto 85%',
	backgroundRepeat: 'no-repeat',
}));

const VideoBox = ({
	position = 'relative',
	width,
	height,
	margin,
	order,
	zIndex,
	sx,
	activeSpeaker,
	children,
}: VideoBoxProps): JSX.Element => {
	return (
		<StyledVideoBox
			position={position}
			width={width}
			height={height}
			activeSpeaker={activeSpeaker}
			order={order}
			margin={margin}
			zIndex={zIndex}
			children={children}
			sx={sx}
		/>
	);
};

export default VideoBox;