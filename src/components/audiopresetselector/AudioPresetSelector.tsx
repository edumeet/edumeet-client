import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { updateAudioSettings } from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { selectAudioPresetLabel } from '../translated/translatedComponents';

const AudioPresetSelector = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const audioPreset = useAppSelector((state) => state.settings.audioPreset);
	const audioPresets = useAppSelector((state) => state.settings.audioPresets);

	const handleAudioPresetChange = (event: SelectChangeEvent<string>): void => {
		dispatch(settingsActions.setAudioPreset(event.target.value));

		dispatch(updateAudioSettings(audioPresets[event.target.value]));
	};

	return (
		<FormControl fullWidth>
			<Select
				value={ audioPreset }
				onChange={ handleAudioPresetChange }
				displayEmpty
				autoWidth
			>
				{ Object.keys(audioPresets).map((value, index) => (
					<MenuItem key={index} value={value} >
						{ audioPresets[value].name }
					</MenuItem>
				))}
			</Select>
			<FormHelperText>
				{ selectAudioPresetLabel() }
			</FormHelperText>
		</FormControl>
	);
};

export default AudioPresetSelector;