import { memo, ReactNode } from 'react';
import { styled, SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';

interface VideoBoxProps {
	position?: 'relative' | 'absolute';
	width?: number | string;
	height?: number | string;
	margin?: number;
	order?: number;
	activeSpeaker?: boolean;
	roundedCorners?: boolean;
	children?: ReactNode;
	sx?: SxProps<Theme>;
}

type StyledVideoBoxProps = {
	position?: 'relative' | 'absolute';
	width?: number | string;
	height?: number | string;
	margin?: number;
	order?: number;
	activespeaker?: number;
	roundedcorners?: number;
};

const StyledVideoBox = styled(Box)<StyledVideoBoxProps>(({
	theme,
	position,
	height,
	width,
	margin = 0,
	order,
	activespeaker,
	roundedcorners,
}) => ({
	position,
	width,
	height,
	margin: theme.spacing(margin),
	order,
	...(activespeaker && {
		outline: theme.activeSpeakerBorder
	}),
	boxShadow: theme.shadows[10],
	backgroundColor: theme.videoBackroundColor,
	backgroundImage: `url(${theme.videoAvatarImage})`,
	backgroundPosition: 'bottom',
	backgroundSize: 'auto 85%',
	backgroundRepeat: 'no-repeat',
	borderRadius: roundedcorners ? theme.roundedness : '0',
}));

const VideoBox = ({
	position = 'relative',
	width,
	height,
	margin,
	order,
	sx,
	activeSpeaker,
	children,
	roundedCorners = true,
}: VideoBoxProps): JSX.Element => {
	return (
		<StyledVideoBox
			position={position}
			width={width}
			height={height}
			activespeaker={activeSpeaker ? 1 : 0}
			order={order}
			margin={margin}
			children={children}
			roundedcorners={roundedCorners ? 1 : 0}
			sx={sx}

			/* style={{ zIndex: '200' }}  */
		/>
	);
};

export default memo(VideoBox);
