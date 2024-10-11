import { Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { ServiceContext } from '../../store/store';
import { mutedPTTLabel } from '../translated/translatedComponents';
import { useAppSelector } from '../../store/hooks';

const StyledAlert = styled(Alert)(() => ({
	position: 'absolute',
	width: '100%',
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
		const volumeWatcher = mediaService.mediaSenders['mic'].volumeWatcher;

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
