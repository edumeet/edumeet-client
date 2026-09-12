import { IconButton, Tooltip } from '@mui/material';
import { SettingsInputAntenna } from '@mui/icons-material';
import { red } from '@mui/material/colors';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import edumeetConfig from '../../utils/edumeetConfig';
import { connectivityProblemLabel } from '../translated/translatedComponents';
import { useConnectivityLabels } from './connectivityLabels';
import { useConnectivityReport } from './useConnectivityReport';

/**
 * Top bar indicator for *connectivity* problems - media not getting through at
 * all - as opposed to the quality badge next to it, which reports a call that
 * works but is degraded. It therefore uses the antenna glyph rather than signal
 * bars, and it is always red: there is no "somewhat connected".
 *
 * It only appears while a connectivity check is actually failing, and clicking
 * it opens the same dialog as the participant list button.
 */
const ConnectivityIndicator = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const labels = useConnectivityLabels();
	const report = useConnectivityReport(edumeetConfig.connectivityCheckEnabled);

	const culprit = report?.culprit;

	if (!culprit) return <></>;

	const title = `${connectivityProblemLabel()}: ${labels.checks[culprit]}`;

	return (
		<Tooltip title={title} placement='bottom'>
			<IconButton
				aria-label={title}
				size='small'
				onClick={() => dispatch(uiActions.setUi({ connectivityDialogOpen: true }))}
			>
				<SettingsInputAntenna style={{ color: red[400] }} />
			</IconButton>
		</Tooltip>
	);
};

export default ConnectivityIndicator;
