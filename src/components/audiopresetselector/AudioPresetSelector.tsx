import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { updateMic, updatePreviewMic } from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { selectAudioPresetLabel } from '../translated/translatedComponents';

const AudioPresetSelector = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const audioPreset = useAppSelector((state) => state.settings.audioPreset);
	const audioPresets = useAppSelector((state) => state.settings.audioPresets);

	const handleAudioPresetChange = (event: SelectChangeEvent<string>): void => {
		const {
			autoGainControl,
			echoCancellation,
			noiseSuppression,
			// voiceActivatedUnmute,
			// noiseThreshold,
			sampleRate,
			channelCount,
			sampleSize,
			opusDtx,
			opusFec,
			opusPtime,
			opusMaxPlaybackRate
		} = audioPresets[event.target.value];

		dispatch(settingsActions.setAudioPreset(event.target.value));

		dispatch(settingsActions.setAutoGainControl(autoGainControl));
		dispatch(settingsActions.setEchoCancellation(echoCancellation));
		dispatch(settingsActions.setNoiseSuppression(noiseSuppression));
		// dispatch(settingsActions.setVoiceActivatedUnmute(voiceActivatedUnmute));
		// dispatch(settingsActions.setNoiseThreshold(noiseThreshold));
		dispatch(settingsActions.setSampleRate(sampleRate));
		dispatch(settingsActions.setChannelCount(channelCount));
		dispatch(settingsActions.setSampleSize(sampleSize));
		dispatch(settingsActions.setOpusDtx(opusDtx));
		dispatch(settingsActions.setOpusFec(opusFec));
		dispatch(settingsActions.setOpusPtime(opusPtime));
		dispatch(settingsActions.setOpusMaxPlaybackRate(opusMaxPlaybackRate));

		dispatch(updateMic());
		dispatch(updatePreviewMic());
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