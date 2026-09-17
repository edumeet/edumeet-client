import { Box, Slider, Typography, styled } from '@mui/material';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { setLastNLabel } from '../translated/translatedComponents';

const StyledSlider = styled(Box)(({ theme }) => ({
	paddingTop: theme.spacing(2),
	paddingLeft: theme.spacing(4),
	paddingRight: theme.spacing(4),
	paddingBottom: theme.spacing(2),
}));

const MIN = 2;
const MAX = 49;
// Grid-shaped tile counts offered as guides between the two ends.
const GRID_MARKS = [ 4, 9, 12, 24 ];
const MARKS = [ MIN, ...GRID_MARKS.filter((value) => value > MIN && value < MAX), MAX ].map((value) => ({ value }));

// The slider counts tiles including the local user; the stored value counts the
// other participants only, like the room-server and the management UI. A room
// limit outside the slider's range is shown at the nearest end rather than off
// the track, and is only changed if the user moves the thumb.
const toSlider = (lastN: number): number => Math.min(Math.max(lastN + 1, MIN), MAX);
const toLastN = (slider: number): number => slider - 1;

const LastNSlider = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const lastN = useAppSelector((state) => state.settings.maxActiveVideos);
	const [ sliderValue, setSliderValue ] = useState<number>(toSlider(lastN));

	useEffect(() => setSliderValue(toSlider(lastN)), [ lastN ]);

	const handleSliderChange = (event: Event, value: number | number[]): void => {
		setSliderValue(value as number);
	};

	const handleSliderChangeCommitted = (
		_event: Event | SyntheticEvent,
		value: number | number[]
	): void => {
		const realLastN = toLastN(value as number);

		if (realLastN !== lastN)
			dispatch(settingsActions.setMaxActiveVideos(realLastN));
	};

	return (
		<StyledSlider>
			<Typography>
				{ setLastNLabel() }:
			</Typography>
			<Slider
				value={ sliderValue }
				min={ MIN }
				max={ MAX }
				step={ 1 }
				valueLabelDisplay={ 'auto' }
				onChange={ handleSliderChange }
				onChangeCommitted={ handleSliderChangeCommitted }
				marks={ MARKS }
			/>
		</StyledSlider>
	);
};

export default LastNSlider;
