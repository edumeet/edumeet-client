import { FormControlLabel, Switch } from '@mui/material';
import {
	updateVideoSettings,
	updateAudioSettings,
} from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	autoGainControlLabel,
	backgroundBlurLabel,
	echoCancellationLabel,
	enableOpusDtxLabel,
	enableOpusFecLabel,
	noiseSuppressionLabel
} from '../translated/translatedComponents';

export const EchoCancellationSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const echoCancellation = useAppSelector((state) => state.settings.echoCancellation);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ echoCancellation }
					onChange={(event): void => {
						dispatch(updateAudioSettings({ echoCancellation: event.target.checked }));
					}}
				/>
			}
			label={ echoCancellationLabel() }
		/>
	);
};

export const AutoGainControlSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const autoGainControl = useAppSelector((state) => state.settings.autoGainControl);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ autoGainControl }
					onChange={(event): void => {
						dispatch(updateAudioSettings({ autoGainControl: event.target.checked }));
					}}
				/>
			}
			label={ autoGainControlLabel() }
		/>
	);
};

export const NoiseSuppressionSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const noiseSuppression = useAppSelector((state) => state.settings.noiseSuppression);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ noiseSuppression }
					onChange={(event): void => {
						dispatch(updateAudioSettings({ noiseSuppression: event.target.checked }));
					}}
				/>
			}
			label={ noiseSuppressionLabel() }
		/>
	);
};

export const OpusDtxSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const opusDtx = useAppSelector((state) => state.settings.opusDtx);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ opusDtx }
					onChange={(event): void => {
						dispatch(updateAudioSettings({ opusDtx: event.target.checked }));
					}}
				/>
			}
			label={ enableOpusDtxLabel() }
		/>
	);
};

export const OpusFecSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const opusFec = useAppSelector((state) => state.settings.opusFec);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ opusFec }
					onChange={(event): void => {
						dispatch(updateAudioSettings({ opusFec: event.target.checked }));
					}}
				/>
			}
			label={ enableOpusFecLabel() }
		/>
	);
};

export const BlurSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const blurEnabled = useAppSelector((state) => state.settings.blurEnabled);
	const blurSwitchDisabled = useAppSelector((state) => state.me.videoInProgress);

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ blurEnabled }
					onChange={(event): void => {
						dispatch(updateVideoSettings({ blurEnabled: event.target.checked }));
					}}
					disabled={blurSwitchDisabled}
				/>
			}
			label={ backgroundBlurLabel() }
		/>
	);
};
