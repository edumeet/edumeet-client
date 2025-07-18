import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { Button } from '@mui/material';
import { useEffect } from 'react';
import { clearImageStorage, loadUserBackground } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import { closeLabel, removeAllImagesLabel, selectBackgroundLabel } from '../translated/translatedComponents';
import BackgroundPicker from './BackgroundPicker';
import UploadImageButton from './UploadFileButton';
import { RoomBackgroundPreview } from './RoomBackgroundPreview';
import RoomBackgroundTile from './RoomBackgroundTile';

const BackgroundSelectDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const backgroundSelectDialogOpen = useAppSelector((state) => state.ui.backgroundSelectDialogOpen);
	const selectedBackground = useAppSelector((state) => state.me.selectedDestop);

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadUserBackground());
		};

		checkForSavedBackground();
	}, []);

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
		dispatch(meActions.setSelectedDestop(null));
	};

	const handleCloseDialog = (): void => {
		dispatch(uiActions.setUi({ backgroundSelectDialogOpen: !backgroundSelectDialogOpen }));
	};

	return (
		<GenericDialog
			open={backgroundSelectDialogOpen}
			onClose={handleCloseDialog}
			maxWidth='md'
			title={selectBackgroundLabel()}
			content={
				<BackgroundPicker
					selectedBackground={ selectedBackground }
					setSelectedBackground={ (selected) => dispatch(meActions.setSelectedDestop(selected)) }
					defaultTile={<RoomBackgroundTile />}>
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
						onClick={handleCloseDialog}
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
