import { FormControlLabel, Switch } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updatePreviewWebcam } from '../../store/actions/mediaActions';
import { mediaActions } from '../../store/slices/mediaSlice';

const BlurBackgroundSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const { videoInProgress, previewWebcamTrackId, previewBlurBackground 
	} = useAppSelector((state) => state.media);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	): void => {
		dispatch(
			mediaActions.setPreviewBlurBackground(event.target.checked)
		);
		dispatch(updatePreviewWebcam());
	};
	
	return (
		<FormControlLabel
			control={
				<Switch
					disabled={videoInProgress || !previewWebcamTrackId}
					checked={ previewBlurBackground }
					onChange={handleChange}
					inputProps={ { 'aria-label': 'controlled' } }
				/>
			}
			label="Blur video background"
		/>
	);
};

export default BlurBackgroundSwitch; 