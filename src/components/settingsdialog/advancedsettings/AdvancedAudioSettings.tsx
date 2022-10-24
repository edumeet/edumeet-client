import { useState } from 'react';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { advancedAudioSettingsLabel } from '../../translated/translatedComponents';
import {
	AutoGainControlSwitch,
	EchoCancellationSwitch,
	NoiseSuppressionSwitch,
	OpusDtxSwitch,
	OpusFecSwitch
} from '../SettingsSwitches';
import {
	ChannelCountSelector,
	OpusPtimeSelector,
	SampleRateSelector,
	SampleSizeSelector
} from '../SettingsSelectors';
import NoiseSlider from '../../noiseslider/NoiseSlider';

const sampleRateData: Array<number> = [ 8000, 16000, 24000, 44100, 48000 ];
const channelCountData: Array<number> = [ 1, 2 ];
const sampleSizeData: Array<number> = [ 8, 16, 24, 32 ];
const opusPtimeData: Array<number> = [ 3, 5, 10, 20, 30, 40, 50, 60 ];

const AdvancedAudioSettings = (): JSX.Element => {
	const [ open, setOpen ] = useState(false);

	const handleClick = () => {
		setOpen(!open);
	};

	return (
		<List>
			<ListItemButton onClick={ handleClick }>
				<ListItemText primary={ advancedAudioSettingsLabel() } />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>
			<Collapse in={ open } timeout='auto' unmountOnExit>
				<List component='div'>
					<EchoCancellationSwitch />
					<AutoGainControlSwitch />
					<NoiseSuppressionSwitch />
					<NoiseSlider />
					<SampleRateSelector data={ sampleRateData } />
					<ChannelCountSelector data={ channelCountData } />
					<SampleSizeSelector data={ sampleSizeData } />
					<OpusDtxSwitch />
					<OpusFecSwitch />
					<OpusPtimeSelector data={ opusPtimeData } />
				</List>
			</Collapse>
		</List>
	);
};

export default AdvancedAudioSettings;