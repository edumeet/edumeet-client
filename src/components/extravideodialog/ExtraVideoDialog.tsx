import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import { closeLabel, extraVideoLabel, startExtraVideoLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { startExtraVideo } from '../../store/actions/mediaActions';
import ExtraVideoInputChooser from '../devicechooser/ExtraVideoInputChooser';

const ExtraVideoDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const extraVideoDialogOpen = useAppSelector((state) => state.ui.extraVideoDialogOpen);
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const [ deviceId, setDeviceId ] = useState<string | undefined>();

	const handleCloseExtraVideoDialog = (): void => {
		dispatch(uiActions.setUi({
			extraVideoDialogOpen: !extraVideoDialogOpen
		}));
	};

	const handleStartExtraVideo = (): void => {
		dispatch(startExtraVideo({ newDeviceId: deviceId }));
	};

	return (
		<StyledDialog
			open={extraVideoDialogOpen}
			onClose={handleCloseExtraVideoDialog}
		>
			<DialogTitle>
				{ extraVideoLabel() }
			</DialogTitle>
			<DialogContent>
				<ExtraVideoInputChooser onDeviceChange={setDeviceId} />
			</DialogContent>
			<DialogActions>
				<Button
					aria-label={startExtraVideoLabel()}
					disabled={videoInProgress}
					onClick={handleStartExtraVideo}
				>
					{ startExtraVideoLabel() }
				</Button>
				<Button
					aria-label={closeLabel()}
					onClick={handleCloseExtraVideoDialog}
					startIcon={<CloseIcon />}
				>
					{ closeLabel() }
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default ExtraVideoDialog;