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
import { BackgroundConfig, BackgroundType } from '../../utils/types';
import { loadVideoBackground, updateVideoSettings } from '../../store/actions/mediaActions';
import { ImageKeys } from '../../services/clientImageService';

const toSelectedBackgroundFromVideo = (conf: BackgroundConfig | null): SelectedBackground | null => {
	if (!conf?.url) return null;

	return {
		imageName: ImageKeys.VIDEO_BACKGROUND,
		imageUrl: conf.url,
	};
};

const fromSelectedBackgroundToVideo = (selected: SelectedBackground | null): BackgroundConfig => {
	return {
		type: selected ? BackgroundType.IMAGE : BackgroundType.NONE,
		url: selected?.imageUrl,
	};
};

const VideoBackgroundDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const videoBackgroundDialogOpen = useAppSelector((state) => state.ui.videoBackgroundDialogOpen);
	const videoBackground = useAppSelector((state) => state.settings.videoBackgroundEffect);

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadVideoBackground());
		};

		checkForSavedBackground();
	}, []);

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
		dispatch(updateVideoSettings({
			videoBackgroundEffect: {
				type: BackgroundType.NONE,
			}
		}));
	};

	const handleCloseVideoBackgroundDialog = (): void => {
		dispatch(uiActions.setUi({ videoBackgroundDialogOpen: !videoBackgroundDialogOpen }));
	};

	return (
		<GenericDialog
			open={videoBackgroundDialogOpen}
			onClose={handleCloseVideoBackgroundDialog}
			maxWidth='md'
			title={selectVideoBackgroundLabel()}
			content={
				<BackgroundPicker
					selectedBackground={toSelectedBackgroundFromVideo(videoBackground)}
					setSelectedBackground={(selected) => dispatch(updateVideoSettings({ videoBackgroundEffect: fromSelectedBackgroundToVideo(selected) }))}>
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
