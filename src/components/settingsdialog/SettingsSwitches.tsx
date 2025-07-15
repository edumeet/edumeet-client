import { Button, FormControlLabel, Switch, Tooltip } from '@mui/material';
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
	noiseSuppressionLabel,
	selectVideoBackgroundLabel
} from '../translated/translatedComponents';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import BlurOffIcon from '@mui/icons-material/BlurOff';
import ImageIcon from '@mui/icons-material/Image';
import HideImageIcon from '@mui/icons-material/HideImage';
import { uiActions } from '../../store/slices/uiSlice';
import { BackgroundType } from '../../utils/types';
import { meActions } from '../../store/slices/meSlice';

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
	const blurSwitchDisabled = useAppSelector((state) => state.me.videoInProgress);
	const videoBackgroundEffectType = useAppSelector((state) => state.me.videoBackgroundEffect?.type);
	const blurEnabled = videoBackgroundEffectType === BackgroundType.BLUR;

	return (
		<FormControlLabel
			control={
				<Switch
					color='primary'
					checked={ blurEnabled }
					onChange={(event): void => {
						dispatch(meActions.setVideoBackgroundEffect({ type: event.target.checked ? BackgroundType.BLUR : BackgroundType.NONE }));
						dispatch(updateVideoSettings());
					}}
					disabled={blurSwitchDisabled}
				/>
			}
			label={ backgroundBlurLabel() }
		/>
	);
};

export const BlurButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const blurSwitchDisabled = useAppSelector((state) => state.me.videoInProgress);
	const videoBackgroundEffectType = useAppSelector((state) => state.me.videoBackgroundEffect?.type);
	const blurEnabled = videoBackgroundEffectType === BackgroundType.BLUR;

	return (
		<Tooltip title={ backgroundBlurLabel() } disableInteractive>
			<span>
				<Button
					onClick={() => {
						dispatch(meActions.setVideoBackgroundEffect({ type: blurEnabled ? BackgroundType.NONE : BackgroundType.BLUR }));
						dispatch(updateVideoSettings());
					}}
					disabled={blurSwitchDisabled}>
					{!blurEnabled && <BlurOnIcon />}
					{blurEnabled && <BlurOffIcon />}
				</Button>
			</span>
		</Tooltip>
		
	);
};

export const VideoBackgroundButton = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoBackgroundSwitchDisabled = useAppSelector((state) => state.me.videoInProgress);
	const videoBackgroundEffectType = useAppSelector((state) => state.me.videoBackgroundEffect?.type);
	const backgroundEnabled = videoBackgroundEffectType === BackgroundType.IMAGE;

	const handleClick = () => {
		if (backgroundEnabled) {
			// was enabled, so disable
			dispatch(meActions.setVideoBackgroundEffectDisabled());
			dispatch(updateVideoSettings());
		} else {
			// was disabled, so open dialog
			dispatch(uiActions.setUi({ videoBackgroundDialogOpen: true }));
		}
	};

	return (
		<Tooltip title={ selectVideoBackgroundLabel() } disableInteractive>
			<span>
				{backgroundEnabled}
				<Button
					onClick={handleClick}
					disabled={videoBackgroundSwitchDisabled}>
					{!backgroundEnabled && <ImageIcon />}
					{backgroundEnabled && <HideImageIcon />}
				</Button>
			</span>
		</Tooltip>
		
	);
};
