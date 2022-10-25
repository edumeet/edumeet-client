import {
	FormControl,
	FormHelperText,
	MenuItem,
	Select,
	SelectChangeEvent
} from '@mui/material';
import {
	updateAudioSettings,
	updateScreenshareSettings,
	updateVideoSettings
} from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Resolution } from '../../utils/types';
import {
	selectAudioChannelCountLabel,
	selectAudioSampleRateLabel,
	selectAudioSampleSizeLabel,
	selectOpusPtimeLabel,
	selectRecordingsPreferredMimeTypeLabel,
	selectResolutionLabel,
	selectScreenSharingFrameRateLabel,
	selectWebcamFrameRateLabel
} from '../translated/translatedComponents';

interface ResolutionSelectorProps {
	resolutions: Array<{ value: Resolution, label: () => string }>
}

export const ResolutionSelector = ({
	resolutions
}: ResolutionSelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const resolution = useAppSelector((state) => state.settings.resolution);

	const handleResolutionChange = (event: SelectChangeEvent<string>): void => {
		dispatch(updateVideoSettings({
			resolution: event.target.value
		}));
	};

	return (
		<FormControl fullWidth>
			<Select
				value={ resolution }
				onChange={ handleResolutionChange }
				displayEmpty
				autoWidth
			>
				{ resolutions.map(({ value, label }, index) => (
					<MenuItem key={index} value={value} >
						{ label() }
					</MenuItem>
				)) }
			</Select>
			<FormHelperText>
				{ selectResolutionLabel() }
			</FormHelperText>
		</FormControl>
	);
};

type Device = 'webcam' | 'screen';

interface FrameRateSelectorProps {
	device: Device,
	frameRates: Array<number>
}

export const FrameRateSelector = ({
	device,
	frameRates
}: FrameRateSelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const frameRate = useAppSelector((state) => {
		return (device === 'webcam' ? state.settings.frameRate : 
			state.settings.screenSharingFrameRate);
	});

	const handleFrameRateChange = (event: SelectChangeEvent<string>): void => {
		if (device === 'webcam') {
			dispatch(updateVideoSettings({
				frameRate: parseInt(event.target.value)
			}));
		} else {
			dispatch(updateScreenshareSettings({
				screenSharingFrameRate: parseInt(event.target.value)
			}));
		}
	};

	return (
		<FormControl fullWidth>
			<Select
				value={ frameRate }
				onChange={ handleFrameRateChange }
				displayEmpty
				autoWidth
			>
				{ frameRates.map((value, index) => (
					<MenuItem key={index} value={value} >
						{ value }
					</MenuItem>
				))}
			</Select>
			<FormHelperText>
				{ device === 'webcam' ? selectWebcamFrameRateLabel() :
					selectScreenSharingFrameRateLabel() }
			</FormHelperText>
		</FormControl>
	);
};

// TODO
export const MimeTypeSelector = (): JSX.Element => {
	// const dispatch = useAppDispatch();
	// const mimeType = useAppSelector((state) => state.settings);

	return (
		<FormControl fullWidth>
			<Select>
				
			</Select>
			<FormHelperText>
				{ selectRecordingsPreferredMimeTypeLabel() }
			</FormHelperText>
		</FormControl>
	);
};

interface SelectorProps {
	data: Array<number>;
}

export const SampleRateSelector = ({
	data
}: SelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const sampleRate = useAppSelector((state) => state.settings.sampleRate);

	return (
		<FormControl fullWidth>
			<Select
				value={ sampleRate }
				onChange={(event: SelectChangeEvent<string>): void => {
					dispatch(updateAudioSettings({ sampleRate: parseInt(event.target.value) }));
				}}
				displayEmpty
				autoWidth
			>
				{ data.map((value, index) => (
					<MenuItem key={index} value={value} >
						{ (value / 1000).toString().concat(' kHz') }
					</MenuItem>
				)) }
			</Select>
			<FormHelperText>
				{ selectAudioSampleRateLabel() }
			</FormHelperText>
		</FormControl>
	);
};

export const ChannelCountSelector = ({
	data
}: SelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const channelCount = useAppSelector((state) => state.settings.channelCount);

	return (
		<FormControl fullWidth>
			<Select
				value={ channelCount }
				onChange={(event: SelectChangeEvent<string>): void => {
					dispatch(updateAudioSettings({ channelCount: parseInt(event.target.value) }));
				}}
				displayEmpty
				autoWidth
			>
				{ data.map((value, index) => (
					<MenuItem key={index} value={value} >
						{ value === 1 ? '1 (mono)' : '2 (stereo)' }
					</MenuItem>
				)) }
			</Select>
			<FormHelperText>
				{ selectAudioChannelCountLabel() }
			</FormHelperText>
		</FormControl>
	);
};

export const SampleSizeSelector = ({
	data
}: SelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const sampleSize = useAppSelector((state) => state.settings.sampleSize);

	return (
		<FormControl fullWidth>
			<Select
				value={ sampleSize }
				onChange={(event: SelectChangeEvent<string>): void => {
					dispatch(updateAudioSettings({ sampleSize: parseInt(event.target.value) }));
				}}
				displayEmpty
				autoWidth
			>
				{ data.map((value, index) => (
					<MenuItem key={index} value={value} >
						{ value.toString().concat(' bit') }
					</MenuItem>
				)) }
			</Select>
			<FormHelperText>
				{ selectAudioSampleSizeLabel() }
			</FormHelperText>
		</FormControl>
	);
};

export const OpusPtimeSelector = ({
	data
}: SelectorProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const opusPtime = useAppSelector((state) => state.settings.opusPtime);

	return (
		<FormControl fullWidth>
			<Select
				value={ opusPtime }
				onChange={(event: SelectChangeEvent<string>): void => {
					dispatch(updateAudioSettings({ opusPtime: parseInt(event.target.value) }));
				}}
				displayEmpty
				autoWidth
			>
				{ data.map((value, index) => (
					<MenuItem key={index} value={value} >
						{ value.toString().concat(' ms') }
					</MenuItem>
				)) }
			</Select>
			<FormHelperText>
				{ selectOpusPtimeLabel() }
			</FormHelperText>
		</FormControl>
	);
};