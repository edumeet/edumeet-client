import { FormControlLabel, Switch } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';

const BlurBackgroundSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const { blurBackground } = useAppSelector((state) => state.settings);
	const { videoInProgress, previewWebcamTrackId

	} = useAppSelector((state) => state.me);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		setting: string
	): void => {
		dispatch(
			settingsActions.updateSettings({ [`${setting}`]: event.target.checked })
		);
	};
	
	return (
		<FormControlLabel
			control={
				<Switch
					disabled={videoInProgress || !previewWebcamTrackId}
					checked={ blurBackground }
					onChange={ (event) => handleChange(event, 'blurBackground') }
					inputProps={ { 'aria-label': 'controlled' } }
				/>
			}
			label="Blur video background"
		/>
	);
};

export default BlurBackgroundSwitch; 