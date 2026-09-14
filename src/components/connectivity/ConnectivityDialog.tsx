import { Alert, Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Cancel, CheckCircle, Close, HourglassEmpty, RemoveCircleOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	closeLabel,
	connectivityCheckTitleLabel,
	connectivityHealthyLabel,
	connectivityNothingToReceiveLabel,
	connectivityPendingLabel,
	connectivityProblemTitleLabel,
} from '../translated/translatedComponents';
import { ConnectivityCheck } from './connectivityReport';
import { useConnectivityLabels } from './connectivityLabels';
import { useConnectivityReport } from './useConnectivityReport';

const Row = styled(Box)(({ theme }) => ({
	display: 'flex',
	alignItems: 'flex-start',
	gap: theme.spacing(1),
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
}));

const RowText = styled(Box)({
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
});

const Detail = styled(Typography)({
	opacity: 0.7,
});

const statusIcon = (status: ConnectivityCheck['status']): React.JSX.Element => {
	switch (status) {
		case 'ok':
			return <CheckCircle color='success' fontSize='small' />;
		case 'failed':
			return <Cancel color='error' fontSize='small' />;
		case 'skipped':
			return <RemoveCircleOutlined color='disabled' fontSize='small' />;
		default:
			return <HourglassEmpty color='warning' fontSize='small' />;
	}
};

/**
 * Step-by-step connectivity report.
 *
 * Opened from the participant list button or from the top bar indicator when
 * something is wrong - it is never opened on its own, so it can also be used as
 * a plain "is my connection fine?" check.
 */
const ConnectivityDialog = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const open = useAppSelector((state) => state.ui.connectivityDialogOpen);
	const labels = useConnectivityLabels();
	const report = useConnectivityReport(open);

	const handleClose = () => dispatch(uiActions.setUi({ connectivityDialogOpen: false }));

	if (!open) return <></>;

	const culprit = report?.culprit;
	const settled = report?.checks.every((check) => check.status === 'ok' || check.status === 'skipped') ?? false;

	const severity = culprit ? 'warning' : settled ? 'success' : 'info';

	const title = culprit ? connectivityProblemTitleLabel() : connectivityCheckTitleLabel();

	const summary = culprit
		? labels.hints[culprit]
		: settled ? connectivityHealthyLabel() : connectivityPendingLabel();

	return (
		<GenericDialog
			open
			onClose={handleClose}
			maxWidth='sm'
			title={ <Typography variant='h6'>{ title }</Typography> }
			content={
				<Box>
					<Alert severity={severity} sx={{ marginBottom: 1 }}>
						{ summary }
					</Alert>
					{ report?.checks.map((check) => (
						<Row key={check.id}>
							{ statusIcon(check.status) }
							<RowText>
								<Typography variant='body2'>{ labels.checks[check.id] }</Typography>
								{ check.status === 'skipped'
									? <Detail variant='caption'>{ connectivityNothingToReceiveLabel() }</Detail>
									: check.detail && <Detail variant='caption'>{ check.detail }</Detail> }
								{ check.issues.map((issue) => (
									<Detail key={issue.key} variant='caption'>
										{ issue.description ?? issue.label }
									</Detail>
								)) }
							</RowText>
						</Row>
					)) }
				</Box>
			}
			actions={
				<Button onClick={handleClose} startIcon={<Close />} variant='contained' size='small'>
					{ closeLabel() }
				</Button>
			}
		/>
	);
};

export default ConnectivityDialog;
