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
	MimeTypeSelector,
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
const mimeTypeCapability: Record<string, Array<string>> = {
	'video/webm': [ 'Chrome', 'Firefox', 'Safari' ],
	'video/webm;codecs="vp8, opus"': [ 'Chrome', 'Firefox', 'Safari' ],
	'video/webm;codecs="vp9, opus"': [ 'Chrome' ],
	'video/webm;codecs="h264, opus"': [ 'Chrome' ],
	'video/mp4': [],
	'video/mpeg': [],
	'video/x-matroska;codecs=avc1': [ 'Chrome' ]
};

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
			<Collapse in={ open } timeout='auto' unmountOnExit>
				<List component='div'>
					<ResolutionSelector resolutions={ resolutions } />
					<FrameRateSelector device='webcam' frameRates={ frameRates } />
					<FrameRateSelector device='screen' frameRates={ frameRates } />
					<MimeTypeSelector mimeTypeCapability={ Object.keys(mimeTypeCapability) } />
				</List>
			</Collapse>
		</List>
	);
};

export default AdvancedVideoSettings;