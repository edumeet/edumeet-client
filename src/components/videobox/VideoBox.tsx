import { ReactNode } from 'react';
import { useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

interface VideoBoxProps {
	margin?: number;
	order?: number;
	activeSpeaker?: boolean;
	sx?: Record<string, number | string>;
	children?: ReactNode;
}

const VideoBoxDiv = styled('div')(({ theme }) => ({
	position: 'relative',
	boxShadow: theme.peerShadow,
	backgroundColor: theme.peerBackroundColor,
	backgroundImage: `url(${theme.peerAvatar})`,
	backgroundPosition: 'bottom',
	backgroundSize: 'auto 85%',
	backgroundRepeat: 'no-repeat',
	'&:hover': {
		boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05) inset, 0px 0px 8px rgba(82, 168, 236, 0.9)'
	},
}));

const VideoBox = ({
	margin,
	order,
	activeSpeaker,
	sx,
	children,
}: VideoBoxProps): JSX.Element => {
	const theme = useTheme();

	return (
		<VideoBoxDiv
			sx={{
				...(activeSpeaker && {
					border: theme.activeSpeakerBorder
				}),
				order,
				margin,
				...sx
			}}
			children={children}
		/>
	);
};

export default VideoBox;