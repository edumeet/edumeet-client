import { Slider, styled, Typography } from '@mui/material';
import { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { ServiceContext } from '../../store/store';
import { validNoiseThreshold, VolumeWatcher } from '../../utils/volumeWatcher';
import { voiceDetectionThresholdLabel } from '../translated/translatedComponents';

const StyledSlider = styled(Slider)(() => ({
	'.MuiSlider-root': {
		color: '#3880ff',
		height: 2,
		padding: '15px 0'
	},
	'.MuiSlider-track': {
		height: 2
	},
	'.MuiSlider-rail': {
		height: 2,
		opacity: 0.2
	},
	'.MuiSlider-mark': {
		backgroundColor: '#bfbfbf',
		height: 10,
		width: 3,
		marginTop: -3
	},
	'.MuiSlider-markActive': {
		opacity: 1,
		backgroundColor: 'currentColor'
	}
}));

const NoiseSlider = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const micTrackId = useAppSelector((state) => state.me.micTrackId);
	const noiseThreshold = useAppSelector((state) => state.settings.noiseThreshold);
	const { mediaService } = useContext(ServiceContext);
	const [ volumeLevel, setVolume ] = useState<number>(0);
	const [ sliderValue, setSliderValue ] = useState<number>(validNoiseThreshold(noiseThreshold));

	useEffect(() => {
		setSliderValue(validNoiseThreshold(noiseThreshold));
	}, [ noiseThreshold ]);

	useEffect(() => {
		let volumeWatcher: VolumeWatcher | undefined;

		if (micEnabled)
			volumeWatcher = mediaService.mediaSenders['mic'].volumeWatcher;

		// A microphone that restarts (audio settings) stops its meter; the level stays until the new one reports.
		const onVolumeChange = ({ volume }: { volume: number }): void => {
			if (!volumeWatcher?.stopped) setVolume(volume);
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, [ micEnabled, micTrackId ]);

	const handleSliderChange = (_event: Event, value: number | number[]): void => {
		setSliderValue(value as number);
	};

	const handleSliderChangeCommitted = (
		_event: Event | SyntheticEvent,
		value: number | number[]
	): void => {
		if (sliderValue !== noiseThreshold) {
			mediaService.mediaSenders['mic'].volumeWatcher?.setThreshold(value as number);
			dispatch(settingsActions.setNoiseThreshold(value as number));
		}
	};

	return (
		<>
			<Typography gutterBottom>
				{ voiceDetectionThresholdLabel() }:
			</Typography>
			<StyledSlider
				min={ -100 }
				value={ sliderValue }
				max={ 0 }
				valueLabelDisplay={ 'auto' }
				onChange={ handleSliderChange }
				onChangeCommitted={ handleSliderChangeCommitted }
				marks={[ { value: volumeLevel, label: `${volumeLevel.toFixed(0)} dB` } ]}
			/>
		</>
	);
};

export default NoiseSlider;
