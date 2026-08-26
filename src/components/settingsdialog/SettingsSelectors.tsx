import {
	Checkbox,
	FormControl,
	FormControlLabel,
	FormHelperText,
	MenuItem,
	Select,
	SelectChangeEvent,
	Stack,
	Typography
} from '@mui/material';
import { useEffect } from 'react';
import {
	updateVideoSettings,
	updateAudioSettings,
	updateScreenshareSettings,
} from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Resolution } from '../../utils/types';
import {
	selectAudioChannelCountLabel,
	selectAudioSampleRateLabel,
	selectAudioSampleSizeLabel,
	manualRecordingMimeTypeLabel,
	recordingBrowserDefaultLabel,
	selectOpusPtimeLabel,
	selectRecordingsPreferredMimeTypeLabel,
	selectResolutionLabel,
	selectScreenSharingFrameRateLabel,
	selectWebcamFrameRateLabel
} from '../translated/translatedComponents';
import { settingsActions } from '../../store/slices/settingsSlice';
import {
	isRecordingMimeTypeSupported,
	RecordingMimeType,
	resolveRecordingMimeType,
	supportedRecordingMimeTypes
} from '../../utils/recordingMimeTypes';

interface ResolutionSelectorProps {
	resolutions: Array<{ value: Resolution, label: () => string }>
}

export const ResolutionSelector = ({
	resolutions
}: ResolutionSelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const resolution = useAppSelector((state) => state.settings.resolution);

	const handleResolutionChange = (event: SelectChangeEvent<string>): void => {
		dispatch(updateVideoSettings({
			resolution: event.target.value as Resolution
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
}: FrameRateSelectorProps): React.JSX.Element => {
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
				value={ String(frameRate) }
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

export const MimeTypeSelector = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const mimeTypes = supportedRecordingMimeTypes();
	const manual = useAppSelector((state) => state.settings.manualRecordingMimeType);
	const mimeType = useAppSelector((state) => state.settings.preferredRecorderMimeType);
	const recording = useAppSelector((state) => state.room.recording);
	const savingRecording = useAppSelector((state) => state.room.savingRecording);
	const resolved = resolveRecordingMimeType(manual ? mimeType : undefined);
	const locked = Boolean(recording || savingRecording);

	useEffect(() => {
		if (mimeType && !isRecordingMimeTypeSupported(mimeType)) {
			dispatch(settingsActions.setPreferredRecorderMimeType(''));
			dispatch(settingsActions.setManualRecordingMimeType(false));
		}
	}, [ mimeType ]);

	const typeName = (type: RecordingMimeType): string =>
		(type.browserDefault ? `${type.name} (${recordingBrowserDefaultLabel()})` : type.name);

	return (
		<FormControl fullWidth>
			<FormControlLabel
				control={
					<Checkbox
						checked={manual}
						disabled={locked}
						onChange={(event): void => {
							dispatch(settingsActions.setManualRecordingMimeType(event.target.checked));
						}}
					/>
				}
				label={ manualRecordingMimeTypeLabel() }
			/>
			<Select
				value={ (manual ? mimeType : resolved?.mimeType) ?? '' }
				disabled={ !manual || locked }
				onChange={(event: SelectChangeEvent<string>): void => {
					dispatch(settingsActions.setPreferredRecorderMimeType(event.target.value));
				}}
				renderValue={(value): string => {
					const selected = mimeTypes.find((type) => type.mimeType === value);

					return selected ? typeName(selected) : '';
				}}
				displayEmpty
				autoWidth
			>
				{ mimeTypes.map((type) => (
					<MenuItem key={type.mimeType} value={type.mimeType} >
						<Stack>
							<Typography variant='body2'>{ typeName(type) }</Typography>
							<Typography variant='caption' color='text.secondary'>{ type.mimeType }</Typography>
						</Stack>
					</MenuItem>
				)) }
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
}: SelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const sampleRate = useAppSelector((state) => state.settings.sampleRate);

	return (
		<FormControl fullWidth>
			<Select
				value={ String(sampleRate) }
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
}: SelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const channelCount = useAppSelector((state) => state.settings.channelCount);

	return (
		<FormControl fullWidth>
			<Select
				value={ String(channelCount) }
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
}: SelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const sampleSize = useAppSelector((state) => state.settings.sampleSize);

	return (
		<FormControl fullWidth>
			<Select
				value={ String(sampleSize) }
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
}: SelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const opusPtime = useAppSelector((state) => state.settings.opusPtime);

	return (
		<FormControl fullWidth>
			<Select
				value={ String(opusPtime) }
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
