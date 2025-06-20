import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { clearImageStorage, loadUserBackground, setUserBackground } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import { closeLabel, removeAllImagesLabel, selectBackgroundLabel } from '../translated/translatedComponents';
import BackgroundPicker, { SelectedBackground } from './BackgroundPicker';
import UploadImageButton from './UploadFileButton';
import { RoomBackgroundPreview } from './RoomBackgroundPreview';

const BackgroundSelectDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const backgroundSelectDialogOpen = useAppSelector((state) => state.ui.backgroundSelectDialogOpen);

	const [ selectedBackground, setSelectedBackground ] = useState<SelectedBackground | undefined>();

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadUserBackground());
		};

		checkForSavedBackground();
	}, []);

	useEffect(() => {
		selectedBackground
			? dispatch(setUserBackground(selectedBackground.imageName))
			: dispatch(meActions.setBackgroundImage(null));
	}, [ selectedBackground ]);

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
		dispatch(meActions.setBackgroundImage(null));
	};

	const handleCloseBackgroundSelectDialog = (): void => {
		dispatch(uiActions.setUi({ backgroundSelectDialogOpen: !backgroundSelectDialogOpen }));
	};

	return (
		<GenericDialog
			open={backgroundSelectDialogOpen}
			onClose={handleCloseBackgroundSelectDialog}
			maxWidth='md'
			title={selectBackgroundLabel()}
			content={
				<BackgroundPicker
					selectedBackground={ selectedBackground }
					setSelectedBackground={ setSelectedBackground }>
					<RoomBackgroundPreview selectedBackground={ selectedBackground?.imageUrl } />
				</BackgroundPicker>
			}
			actions={
				<>
					<UploadImageButton />
					<Button
						color='secondary'
						onClick={handleClearStorage}
						size='small'
						startIcon={<DeleteForever />}
					>
						{removeAllImagesLabel()}
					</Button>
					<Button
						onClick={handleCloseBackgroundSelectDialog}
						size='small'
						startIcon={<CloseIcon />}
						variant='contained'
					>
						{closeLabel()}
					</Button>
				</>
			}
		/>
	);
};

export default BackgroundSelectDialog;
