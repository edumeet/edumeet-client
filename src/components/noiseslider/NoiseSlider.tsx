import { Slider, styled, Typography } from '@mui/material';
import { Harker } from 'hark';
import { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import { settingsActions } from '../../store/slices/settingsSlice';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import { noiseThresholdLabel } from '../translated/translatedComponents';

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

const NoiseSlider = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const noiseThreshold = useAppSelector((state) => state.settings.noiseThreshold);
	const { mediaService } = useContext(ServiceContext);
	const { micProducer } = useAppSelector(meProducersSelector);
	const [ volumeLevel, setVolume ] = useState<number>(0);

	useEffect(() => {
		let producer: Producer | undefined;
		let volumeWatcher: VolumeWatcher | undefined;

		if (micProducer)
			producer = mediaService.getProducer(micProducer.id);

		if (producer)
			volumeWatcher = producer.appData.volumeWatcher as VolumeWatcher;

		const onVolumeChange = ({ volume }: { volume: number }): void => {
			setVolume(volume);
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, []);

	const handleSliderChange = (event: Event, value: number | number[]): void => {
		let producer: Producer | undefined;
		let hark: Harker | undefined;

		if (micProducer)
			producer = mediaService.getProducer(micProducer.id);

		if (producer)
			hark = producer.appData.hark as Harker;

		hark?.setThreshold(value as number);
		dispatch(settingsActions.setNoiseThreshold(value as number));
	};

	return (
		<>
			<Typography gutterBottom>
				{ noiseThresholdLabel() }:
			</Typography>
			<StyledSlider
				min={ -100 }
				value={ noiseThreshold }
				max={ 0 }
				valueLabelDisplay={ 'auto' }
				onChange={ handleSliderChange }
				marks={[ { value: volumeLevel, label: `${volumeLevel.toFixed(0)} dB` } ]}
			/>
		</>
	);
};

export default NoiseSlider;