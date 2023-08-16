import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updatePreviewWebcam } from '../../store/actions/mediaActions';
import { mediaActions } from '../../store/slices/mediaSlice';
import { blurBackgroundNotSupported, enableBlurBackground } from '../translated/translatedComponents';
import { ChooserDiv } from '../devicechooser/DeviceChooser';

const BlurBackgroundSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const { videoInProgress, previewWebcamTrackId, previewBlurBackground 
	} = useAppSelector((state) => state.media);
	const { canBlurBackground } = useAppSelector((state) => state.me);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	): void => {
		dispatch(
			mediaActions.setPreviewBlurBackground(event.target.checked)
		);
		dispatch(updatePreviewWebcam());
	};
	
	return (
		<ChooserDiv>
			<Tooltip title={canBlurBackground ? enableBlurBackground() : blurBackgroundNotSupported()}>
				<FormControlLabel
					control={
						<Switch
							disabled={videoInProgress || !previewWebcamTrackId || !canBlurBackground}
							checked={ previewBlurBackground }
							onChange={handleChange}
							inputProps={ { 'aria-label': 'controlled' } }
					
						/>
					}
					label="Blur video background"
				/></Tooltip>
		</ChooserDiv>
	);
};

export default BlurBackgroundSwitch; 