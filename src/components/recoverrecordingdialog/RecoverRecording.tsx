import { useEffect, useState } from 'react';
import { Button, CircularProgress, IconButton, Tooltip, Typography, styled } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAppDispatch } from '../../store/hooks';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	cancelLabel,
	localRecordingGoneLabel,
	localRecordingSaveFailedLabel,
	recoverRecordingDeleteLabel,
	recoverRecordingSaveLabel,
	recoverRecordingTextLabel,
	recoverRecordingTitleLabel
} from '../translated/translatedComponents';
import {
	discardRecoveredRecording,
	RecoverableRecording,
	recoverableRecording,
	saveRecoveredRecording
} from '../../utils/recordingSink';
import { Logger } from '../../utils/Logger';

const logger = new Logger('RecoverRecording');

let announced = false;

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	position: 'fixed',
	top: theme.spacing(9),
	left: theme.spacing(1),
	zIndex: theme.zIndex.modal + 1,
	backgroundColor: theme.palette.background.paper,
	'&:hover': {
		backgroundColor: theme.palette.background.paper
	}
}));

const formatSize = (size: number): string => {
	const megabytes = size / (1024 * 1024);

	if (megabytes < 1024) return `${megabytes.toFixed(1)} MB`;

	return `${(megabytes / 1024).toFixed(2)} GB`;
};

interface RecoverRecordingProps {
	notify?: boolean;
}

const RecoverRecording = ({ notify = false }: RecoverRecordingProps): React.JSX.Element | null => {
	const dispatch = useAppDispatch();
	const [ recording, setRecording ] = useState<RecoverableRecording | undefined>();
	const [ open, setOpen ] = useState(false);
	const [ busy, setBusy ] = useState(false);

	useEffect(() => {
		recoverableRecording()
			.then((found) => {
				setRecording(found);

				if (!found || !notify || announced) return;

				announced = true;

				dispatch(notificationsActions.enqueueNotification({
					message: recoverRecordingTitleLabel(),
					options: { variant: 'warning' }
				}));
			})
			.catch((error) => logger.error('recoverableRecording() [error:%o]', error));
	}, []);

	if (!recording) return null;

	const handleOpen = async (): Promise<void> => {
		const found = await recoverableRecording()
			.catch((error) => {
				logger.error('handleOpen() [error:%o]', error);

				return undefined;
			});

		setRecording(found);

		if (found) return setOpen(true);

		dispatch(notificationsActions.enqueueNotification({
			message: localRecordingGoneLabel(),
			options: { variant: 'info' }
		}));
	};

	const handleSave = async (): Promise<void> => {
		setBusy(true);

		try {
			await saveRecoveredRecording();
			setRecording(undefined);
		} catch (error) {
			logger.error('handleSave() [error:%o]', error);

			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				dispatch(notificationsActions.enqueueNotification({
					message: localRecordingSaveFailedLabel(),
					options: { variant: 'error' }
				}));
			}
		} finally {
			setBusy(false);
		}
	};

	const handleDiscard = async (): Promise<void> => {
		setBusy(true);

		await discardRecoveredRecording();
		setRecording(undefined);
		setBusy(false);
	};

	return (
		<>
			{ !open &&
				<Tooltip title={recoverRecordingTitleLabel()}>
					<StyledIconButton color='warning' onClick={handleOpen}>
						<WarningAmberIcon />
					</StyledIconButton>
				</Tooltip>
			}
			<GenericDialog
				open={open}
				onClose={() => setOpen(false)}
				title={ recoverRecordingTitleLabel() }
				content={
					<>
						<Typography variant='body2'>{ recoverRecordingTextLabel() }</Typography>
						<Typography variant='caption' color='text.secondary'>
							{ `${recording.filename} (${formatSize(recording.size)})` }
						</Typography>
					</>
				}
				actions={
					<>
						<Button onClick={() => setOpen(false)} disabled={busy}>
							{ cancelLabel() }
						</Button>
						<Button onClick={handleDiscard} disabled={busy} color='error'>
							{ recoverRecordingDeleteLabel() }
						</Button>
						<Button
							onClick={handleSave}
							disabled={busy}
							variant='contained'
							startIcon={busy ? <CircularProgress size={16} color='inherit' /> : undefined}
						>
							{ recoverRecordingSaveLabel() }
						</Button>
					</>
				}
			/>
		</>
	);
};

export default RecoverRecording;
