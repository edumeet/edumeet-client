import { FormControlLabel, Switch } from '@mui/material';
import { updateMic } from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import {
	autoGainControlLabel,
	echoCancellationLabel,
	enableOpusDtxLabel,
	enableOpusFecLabel,
	noiseSuppressionLabel,
	voiceActivatedUnmuteLabel
} from '../translated/translatedComponents';

export const EchoCancellationSwitch = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const echoCancellation = useAppSelector((state) => state.settings.echoCancellation);

	return (
		<FormControlLabel
			control={
				<Switch 
					color="primary"
					checked={ echoCancellation }
					onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						dispatch(settingsActions.setEchoCancellation(event.target.checked));
						dispatch(updateMic());
					} }
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
					color="primary"
					checked={ autoGainControl }
					onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						dispatch(settingsActions.setAutoGainControl(event.target.checked));
						dispatch(updateMic());
					} }
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
					color="primary"
					checked={ noiseSuppression }
					onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						dispatch(settingsActions.setNoiseSuppression(event.target.checked));
						dispatch(updateMic());
					} }
				/>
			}
			label={ noiseSuppressionLabel() }
		/>
	);
};

export const VoiceActivatedUnmuteSwitch = (): JSX.Element => {
	// const dispatch = useAppDispatch();
	const voiceActivatedUnmute =
		useAppSelector((state) => state.settings.voiceActivatedUnmute);

	return (
		<FormControlLabel
			control={
				<Switch 
					color="primary"
					checked={ voiceActivatedUnmute }
					
					/* onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						// TODO
						dispatch(updateMic());
					} } */
				/>
			}
			label={ voiceActivatedUnmuteLabel() }
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
					color="primary"
					checked={ opusDtx }
					onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						dispatch(settingsActions.setOpusDtx(event.target.checked));
						dispatch(updateMic());
					} }
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
					color="primary"
					checked={ opusFec }
					onChange={ (event: React.ChangeEvent<HTMLInputElement>): void => {
						dispatch(settingsActions.setOpusFec(event.target.checked));
						dispatch(updateMic());
					} }
				/>
			}
			label={ enableOpusFecLabel() }
		/>
	);
};