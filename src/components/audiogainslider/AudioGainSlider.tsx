import { useState } from 'react';
import { consumersActions, StateConsumer } from '../../store/slices/consumersSlice';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import { useAppDispatch } from '../../store/hooks';
import { styled } from '@mui/material/styles';
import { Box, Slider, Stack } from '@mui/material';

interface AudioGainSliderProps {
	consumer: StateConsumer;
}

const StyledSliderBox = styled(Box)(({ theme }) => ({
	width: 200,
	margin: theme.spacing(1),
}));

const AudioGainSlider = ({
	consumer
}: AudioGainSliderProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const [ audioGain, setAudioGain ] = useState<number>(consumer.audioGain ?? 1.0);

	const onChange = (event: Event, value: number | number[]) => {
		if (typeof value === 'number')
			setAudioGain(value);
	};

	const handleChange = () => {
		dispatch(consumersActions.setAudioGain({
			consumerId: consumer.id,
			audioGain
		}));
	};

	return (
		<StyledSliderBox>
			<Stack
				spacing={2}
				direction='row'
				alignItems='center'
			>
				<VolumeDown />
				<Slider
					onPointerDown={(event) => event.stopPropagation()}
					aria-label='Volume'
					value={audioGain}
					onChange={onChange}
					onChangeCommitted={handleChange}
					step={0.01}
					min={0}
					max={1}
				/>
				<VolumeUp />
			</Stack>
		</StyledSliderBox>
	);
};

export default AudioGainSlider;