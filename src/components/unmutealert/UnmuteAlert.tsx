import { Alert, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppSelector, usePermissionSelector } from '../../store/hooks';
import { StateProducer } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import { mutedPTT } from '../translated/translatedComponents';

interface UnmuteAlertProps {
	micProducer?: StateProducer;
}

const AlertDiv = styled('div')({
	width: '100%',
	height: '100%',
	display: 'flex'
});

const StyledAlert = styled(Alert)(() => ({
	margin: 'auto',
	textAlign: 'center',
	'.MuiAlert-icon': {
		marginTop: 'auto',
		marginBottom: 'auto'
	}
}));

const UnmuteAlert = ({
	micProducer
}: UnmuteAlertProps): JSX.Element => {
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const { canSendMic, speaking } = useAppSelector((state) => state.me);
	let micState: MediaState;

	if (!canSendMic || !hasAudioPermission)
		micState = 'unsupported';
	else if (!micProducer)
		micState = 'off';
	else if (!micProducer.paused)
		micState = 'on';
	else
		micState = 'muted';

	return (
		<AlertDiv>
			{ micState === 'muted' && speaking && (
				<Fade in={speaking}>
					<StyledAlert variant='filled' severity='warning'>
						{ mutedPTT() }
					</StyledAlert>					
				</Fade>
			) }
		</AlertDiv>
	);
};

export default UnmuteAlert;
