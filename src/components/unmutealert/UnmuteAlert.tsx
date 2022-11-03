import { Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { useAppSelector, usePermissionSelector } from '../../store/hooks';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import { mutedPTTLabel } from '../translated/translatedComponents';

interface UnmuteAlertProps {
	micProducer: StateProducer;
}

const AlertDiv = styled('div')({
	position: 'absolute',
	width: '100%',
	height: '100%',
	zIndex: 3,
	display: 'flex'
});

const StyledAlert = styled(Alert)(() => ({
	transition: 'opacity 1s ease',
	margin: 'auto',
	textAlign: 'center',
	opacity: 0,
	'&.enabled':
	{
		transition: 'opacity 0.1s',
		opacity: 1
	},
	'.MuiAlert-icon': {
		marginTop: 'auto',
		marginBottom: 'auto'
	}
}));

const UnmuteAlert = ({
	micProducer
}: UnmuteAlertProps): JSX.Element => {
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const { canSendMic } = useAppSelector((state) => state.me);
	const { mediaService } = useContext(ServiceContext);
	const [ speaking, setSpeaking ] = useState(false);

	useEffect(() => {
		const producer = mediaService.getProducer(micProducer.id);
		let volumeWatcher: VolumeWatcher | undefined;

		if (producer)
			volumeWatcher = producer.appData.volumeWatcher as VolumeWatcher;

		const onVolumeChange = ({ scaledVolume }: { scaledVolume: number }): void => {
			setSpeaking(Boolean(scaledVolume));
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, []);

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
			<StyledAlert
				variant='filled'
				severity='warning'
				className={ (micState === 'muted' && speaking) ? 'enabled' : '' }
			>
				{ mutedPTTLabel() }
			</StyledAlert>
		</AlertDiv>
	);
};

export default UnmuteAlert;
