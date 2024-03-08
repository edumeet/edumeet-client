import { Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import { mutedPTTLabel } from '../translated/translatedComponents';
import { useAppSelector } from '../../store/hooks';

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

const UnmuteAlert = (): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ speaking, setSpeaking ] = useState(false);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);

	useEffect(() => {
		const producer = mediaService.producers['mic'];
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
			className={ audioMuted && speaking ? 'enabled' : '' }
		>
			<Typography>{ mutedPTTLabel() }</Typography>
		</StyledAlert>
	);
};

export default UnmuteAlert;
