import React from 'react';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import {
	advancedVideoSettingsLabel,
	highResolutionLabel,
	lowResolutionLabel,
	mediumResolutionLabel,
	ultraResolutionLabel,
	veryHighResolutionLabel
} from '../../translated/translatedComponents';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
	FrameRateSelector,
	ResolutionSelector
} from '../SettingsSelectors';
import { Resolution } from '../../../utils/types';

const resolutions: Array<{ value: Resolution, label: () => string }> = [ {
	value: 'low',
	label: lowResolutionLabel
},
{
	value: 'medium',
	label: mediumResolutionLabel
},
{
	value: 'high',
	label: highResolutionLabel
},
{
	value: 'veryhigh',
	label: veryHighResolutionLabel
},
{
	value: 'ultra',
	label: ultraResolutionLabel
} ];
const frameRates: Array<number> = [ 1, 5, 10, 15, 20, 25, 30, 60 ];

const AdvancedVideoSettings = (): JSX.Element => {
	const [ open, setOpen ] = React.useState(false);

	const handleClick = () => {
		setOpen(!open);
	};

	return (
		<List>
			<ListItemButton onClick={ handleClick }>
				<ListItemText primary={ advancedVideoSettingsLabel() } />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>
			<Collapse in={ open } timeout="auto" unmountOnExit>
				<List component="div">
					<ResolutionSelector resolutions={ resolutions } />
					<FrameRateSelector device='webcam' frameRates={ frameRates } />
					<FrameRateSelector device='screen' frameRates={ frameRates } />
				</List>
			</Collapse>
		</List>
	);
};

export default AdvancedVideoSettings;