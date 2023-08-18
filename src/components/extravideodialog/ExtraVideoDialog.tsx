import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel, startExtraVideoLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { startExtraVideo } from '../../store/actions/mediaActions';
import ExtraVideoInputChooser from '../devicechooser/ExtraVideoInputChooser';
import GenericDialog from '../genericdialog/GenericDialog';

const ExtraVideoDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const extraVideoDialogOpen = useAppSelector((state) => state.ui.extraVideoDialogOpen);
	const videoInProgress = useAppSelector((state) => state.media.videoInProgress);
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
		<GenericDialog
			open={extraVideoDialogOpen}
			onClose={handleCloseExtraVideoDialog}
			maxWidth='xs'
			content={ <ExtraVideoInputChooser onDeviceChange={setDeviceId} /> }
			actions={
				<>
					<Button
						aria-label={startExtraVideoLabel()}
						disabled={videoInProgress}
						onClick={handleStartExtraVideo}
						variant='contained'
						size='small'
					>
						{ startExtraVideoLabel() }
					</Button>
					<Button
						aria-label={closeLabel()}
						onClick={handleCloseExtraVideoDialog}
						startIcon={<CloseIcon />}
						variant='contained'
						size='small'
					>
						{ closeLabel() }
					</Button>
				</>
			}
		/>
	);
};

export default ExtraVideoDialog;