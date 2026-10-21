import { Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useAppSelector } from '../../store/hooks';
import { audioPlaybackBlockedLabel } from '../translated/translatedComponents';

const StyledAlert = styled(Alert)(({ theme }) => ({
	position: 'fixed',
	top: theme.spacing(8),
	left: '50%',
	transform: 'translateX(-50%)',
	width: 'max-content',
	maxWidth: `calc(100% - ${theme.spacing(4)})`,
	zIndex: theme.zIndex.snackbar,
	cursor: 'pointer',
	'.MuiAlert-icon': {
		marginTop: 'auto',
		marginBottom: 'auto'
	}
}));

const AudioPlaybackAlert = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const blocked = useAppSelector((state) => state.ui.blockedAudioConsumers.length > 0);

	if (!blocked) return null;

	return (
		<StyledAlert
			variant='filled'
			severity='warning'
			icon={<VolumeOffIcon />}
		>
			<Typography>{ audioPlaybackBlockedLabel() }</Typography>
		</StyledAlert>
	);
};

export default AudioPlaybackAlert;
