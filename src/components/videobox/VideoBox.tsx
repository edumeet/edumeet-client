import { styled } from '@mui/system';

interface VideoBoxProps {
	margin: number;
	order: number;
	activeSpeaker: boolean;
	children?: JSX.Element;
}

const VideoBoxDiv = styled('div')({
	flex: '0 0 auto',
	boxShadow: 'var(--peer-shadow)',
	border: 'var(--peer-border)',
	backgroundColor: 'var(--peer-bg-color)',
	backgroundImage: 'var(--peer-empty-avatar)',
	backgroundPosition: 'bottom',
	backgroundSize: 'auto 85%',
	backgroundRepeat: 'no-repeat',
	'&:hover': {
		boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05) inset, 0px 0px 8px rgba(82, 168, 236, 0.9)'
	},
});

const VideoBox = ({
	margin,
	order,
	activeSpeaker,
	children
}: VideoBoxProps): JSX.Element =>
	<VideoBoxDiv
		sx={{
			...(activeSpeaker && {
				borderColor: 'var(--active-speaker-border-color)'
			}),
			order,
			margin
		}}
		children={children}
	/>;

export default VideoBox;