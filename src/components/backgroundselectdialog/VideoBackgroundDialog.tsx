import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { clearImageStorage } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import { closeLabel, removeAllImagesLabel, selectVideoBackgroundLabel } from '../translated/translatedComponents';
import BackgroundPicker, { SelectedBackground } from './BackgroundPicker';
import UploadImageButton from './UploadFileButton';
import MediaPreview from '../mediapreview/MediaPreview';
import { BackgroundConfig } from '../../utils/types';
import { loadVideoBackground, updateVideoSettings } from '../../store/actions/mediaActions';

const VideoBackgroundDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoBackgroundDialogOpen = useAppSelector((state) => state.ui.videoBackgroundDialogOpen);

	const [ selectedBackground, setSelectedBackground ] = useState<SelectedBackground | undefined>();

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadVideoBackground());
		};

		checkForSavedBackground();
	}, []);

	useEffect(() => {
		const backgroundConfig: BackgroundConfig = {
			type: selectedBackground ? 'image' : 'none',
			url: selectedBackground?.imageUrl,
		};

		dispatch(updateVideoSettings({ videoBackgroundEffect: backgroundConfig }));
	}, [ selectedBackground, setSelectedBackground ]);

	const handleClearStorage = (): void => {
		const backgroundConfig: BackgroundConfig = {
			type: 'none',
		};

		dispatch(clearImageStorage());
		dispatch(updateVideoSettings({ videoBackgroundEffect: backgroundConfig }));
	};

	const handleCloseVideoBackgroundDialog = (): void => {
		dispatch(uiActions.setUi({ videoBackgroundDialogOpen: !videoBackgroundDialogOpen }));
	};

	return (
		<GenericDialog
			open={videoBackgroundDialogOpen}
			onClose={handleCloseVideoBackgroundDialog}
			maxWidth='md'
			title={ selectVideoBackgroundLabel()}
			content={
				<BackgroundPicker
					selectedBackground={ selectedBackground }
					setSelectedBackground={ setSelectedBackground } >
					<MediaPreview withControls={false} />
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
						onClick={handleCloseVideoBackgroundDialog}
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

export default VideoBackgroundDialog;
