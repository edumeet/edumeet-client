import { SettingsInputAntenna } from '@mui/icons-material';
import ControlButton from '../controlbuttons/ControlButton';
import { useContext } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { ServiceContext } from '../../store/store';
import { uiActions } from '../../store/slices/uiSlice';
import edumeetConfig from '../../utils/edumeetConfig';
import { problemGraceMs, useSustained } from '../../utils/useSustained';
import { connectivityProblemLabel } from '../translated/translatedComponents';
import { useConnectivityLabels } from './connectivityLabels';
import { useConnectivityReport } from './useConnectivityReport';

/**
 * Top bar indicator for *connectivity* problems - media not getting through at
 * all - as opposed to the quality badge next to it, which reports a call that
 * works but is degraded. It therefore uses the antenna glyph rather than signal
 * bars. Like every icon in the app bar it takes the app bar colour; being
 * visible at all is the warning.
 *
 * It only appears while a connectivity check has been failing for long enough
 * to outlast the media gap of a peer joining or leaving, and clicking it opens
 * the same dialog as the participant list button.
 */
const ConnectivityIndicator = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const { mediaService } = useContext(ServiceContext);
	const labels = useConnectivityLabels();
	const report = useConnectivityReport(edumeetConfig.connectivityCheckEnabled);

	const culprit = report?.culprit;
	const sustained = useSustained(Boolean(culprit), problemGraceMs(mediaService.monitor));

	if (!culprit || !sustained) return <></>;

	const title = `${connectivityProblemLabel()}: ${labels.checks[culprit]}`;

	return (
		<ControlButton
			type='iconbutton'
			toolTip={title}
			onClick={() => dispatch(uiActions.setUi({ connectivityDialogOpen: true }))}
		>
			<SettingsInputAntenna />
		</ControlButton>
	);
};

export default ConnectivityIndicator;
