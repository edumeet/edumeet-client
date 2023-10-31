import { Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import { mutedPTTLabel } from '../translated/translatedComponents';

interface UnmuteAlertProps {
	micProducer: StateProducer;
}

const StyledAlert = styled(Alert)(() => ({
	position: 'absolute',
	width: '40%',
	left: '50%',
	top: '50%',
	transform: 'translate(-50%, -50%)',
	transition: 'opacity 0.5s ease',
	textAlign: 'center',
	opacity: 0,
	'&.enabled': {
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

	return (
		<StyledAlert
			variant='filled'
			severity='warning'
			className={ micProducer?.paused && speaking ? 'enabled' : '' }
		>
			<Typography>{ mutedPTTLabel() }</Typography>
		</StyledAlert>
	);
};

export default UnmuteAlert;
