import { Button } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel, startExtraVideoLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { startExtraAudio } from '../../store/actions/mediaActions';
import GenericDialog from '../genericdialog/GenericDialog';
import ExtraAudioInputChooser from '../devicechooser/ExtraAudioInputChooser';

const ExtraAudioDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const extraAudioDialogOpen = useAppSelector((state) => state.ui.extraAudioDialogOpen);
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const [ deviceId, setDeviceId ] = useState<string | undefined>();

	const handleCloseExtraAudioDialog = (): void => {
		dispatch(uiActions.setUi({
			extraAudioDialogOpen: !extraAudioDialogOpen
		}));
	};

	const handleStartExtraAudio = (): void => {
		dispatch(startExtraAudio({ newDeviceId: deviceId }));
	};

	return (
		<GenericDialog
			open={extraAudioDialogOpen}
			onClose={handleCloseExtraAudioDialog}
			maxWidth='xs'
			content={ <ExtraAudioInputChooser onDeviceChange={setDeviceId} /> }
			actions={
				<>
					<Button
						aria-label={startExtraVideoLabel()}
						disabled={audioInProgress}
						onClick={handleStartExtraAudio}
						variant='contained'
						size='small'
					>
						{ startExtraVideoLabel() }
					</Button>
					<Button
						aria-label={closeLabel()}
						onClick={handleCloseExtraAudioDialog}
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

export default ExtraAudioDialog;