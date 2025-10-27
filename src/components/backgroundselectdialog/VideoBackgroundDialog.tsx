import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import { Button } from '@mui/material';
import { useEffect } from 'react';
import { clearImageStorage } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import { closeLabel, removeAllImagesLabel, selectVideoBackgroundLabel } from '../translated/translatedComponents';
import BackgroundPicker, { SelectedBackground } from './BackgroundPicker';
import UploadImageButton from './UploadFileButton';
import MediaPreview from '../mediapreview/MediaPreview';
import { BackgroundConfig } from '../../utils/types';
import { loadVideoBackground, setVideoBackground, updateVideoSettings } from '../../store/actions/mediaActions';
import { ImageKeys } from '../../services/clientImageService';
import { meActions } from '../../store/slices/meSlice';

const toSelectedBackgroundFromVideo = (conf: BackgroundConfig | null): SelectedBackground | null => {
	if (!conf?.url) return null;

	return {
		imageName: ImageKeys.VIDEO_BACKGROUND,
		imageUrl: conf.url,
	};
};

const VideoBackgroundDialog = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const videoBackgroundDialogOpen = useAppSelector((state) => state.ui.videoBackgroundDialogOpen);
	const videoBackground = useAppSelector((state) => state.me.videoBackgroundEffect);

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadVideoBackground());
		};

		checkForSavedBackground();

		return () => {
			dispatch(meActions.setVideoBackgroundEffectDisabled());
			dispatch(updateVideoSettings());
		};
	}, []);

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
		dispatch(meActions.setVideoBackgroundEffectDisabled());
		dispatch(updateVideoSettings());
	};

	const handleSelectBackground = (selected: SelectedBackground | null): void => {
		if (selected === null) {
			dispatch(meActions.setVideoBackgroundEffectDisabled());
			dispatch(updateVideoSettings());
		}

		selected?.imageName && dispatch(setVideoBackground(selected.imageName));
		dispatch(uiActions.setUi({ videoBackgroundDialogOpen: !videoBackgroundDialogOpen }));
	};

	const handleCloseVideoBackgroundDialog = (): void => {
		dispatch(uiActions.setUi({ videoBackgroundDialogOpen: !videoBackgroundDialogOpen }));
	};

	return (
		<GenericDialog
			open={ videoBackgroundDialogOpen }
			onClose={ handleCloseVideoBackgroundDialog }
			maxWidth='md'
			title={ selectVideoBackgroundLabel() }
			content={
				<BackgroundPicker
					selectedBackground={ toSelectedBackgroundFromVideo(videoBackground) }
					setSelectedBackground={ (selected) => handleSelectBackground(selected) }
					showDefaultTile={false}>
					<MediaPreview withControls={ false } />
				</BackgroundPicker>
			}
			actions={
				<>
					<UploadImageButton />
					<Button
						color='secondary'
						onClick={ handleClearStorage }
						size='small'
						startIcon={ <DeleteForever /> }
					>
						{ removeAllImagesLabel() }
					</Button>
					<Button
						onClick={ handleCloseVideoBackgroundDialog }
						size='small'
						startIcon={ <CloseIcon /> }
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
