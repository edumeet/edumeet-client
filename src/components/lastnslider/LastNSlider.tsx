import { Box, Slider, Typography, styled } from '@mui/material';
import { SyntheticEvent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { setLastNLabel } from '../translated/translatedComponents';

const StyledSlider = styled(Box)(({ theme }) => ({
	paddingTop: theme.spacing(2),
	paddingLeft: theme.spacing(4),
	paddingRight: theme.spacing(4),
	paddingBottom: theme.spacing(2),
}));

const LastNSlider = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const lastN = useAppSelector((state) => state.settings.maxActiveVideos);
	const [ sliderValue, setSliderValue ] = useState<number>(lastN + 1);

	const handleSliderChange = (event: Event, value: number | number[]): void => {
		setSliderValue(value as number);
	};

	const handleSliderChangeCommitted = (
		_event: Event | SyntheticEvent,
		value: number | number[]
	): void => {
		const realLastN = (value as number) - 1; // LastN doesn't count the local user

		if (sliderValue !== realLastN)
			dispatch(settingsActions.setMaxActiveVideos(realLastN));
	};

	return (
		<StyledSlider>
			<Typography>
				{ setLastNLabel() }:
			</Typography>
			<Slider
				value={ sliderValue }
				min={ 2 }
				max={ 49 }
				step={null}
				valueLabelDisplay={ 'auto' }
				onChange={ handleSliderChange }
				onChangeCommitted={ handleSliderChangeCommitted }
				marks={[
					{ value: 2 },
					{ value: 4 },
					{ value: 9 },
					{ value: 12 },
					{ value: 25 },
					{ value: 49 }
				]}
			/>
		</StyledSlider>
	);
};

export default LastNSlider;