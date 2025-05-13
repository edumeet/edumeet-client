import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import DoneIcon from '@mui/icons-material/Done';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { clearImageStorage, loadUserBackground, setUserBackground } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { uiActions } from '../../store/slices/uiSlice';
import GenericDialog from '../genericdialog/GenericDialog';
import { applyLabel, closeLabel, removeAllImagesLabel, selectBackgroundLabel } from '../translated/translatedComponents';
import BackgroundPicker from './BackgroundPicker';
import UploadImageButton from './UploadFileButton';

const BackgroundSelectDialog = ({ autoApply = false }): JSX.Element => {
	const dispatch = useAppDispatch();
	const backgroundSelectDialogOpen = useAppSelector((state) => state.ui.backgroundSelectDialogOpen);

	const [ selectedBackground, setSelectedBackground ] = useState<string | undefined>();

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadUserBackground());
		};

		checkForSavedBackground();
	}, []);

	useEffect(() => {
		if (!autoApply) return;

		selectedBackground
			? dispatch(setUserBackground(selectedBackground))
			: dispatch(meActions.setBackgroundImage(undefined));
	}, [ selectedBackground ]);

	const handleApply = (): void => {
		dispatch(uiActions.setUi({
			backgroundSelectDialogOpen: !backgroundSelectDialogOpen
		}));
		selectedBackground
			? dispatch(setUserBackground(selectedBackground))
			: dispatch(meActions.setBackgroundImage(undefined));
	};

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
		dispatch(meActions.setBackgroundImage(undefined));
	};

	const handleCloseBackgroundSelectDialog = (): void => {
		dispatch(uiActions.setUi({
			backgroundSelectDialogOpen: !backgroundSelectDialogOpen
		}));
	};

	return (
		<GenericDialog
			open={backgroundSelectDialogOpen}
			onClose={handleCloseBackgroundSelectDialog}
			maxWidth='md'
			title={selectBackgroundLabel()}
			content={
				<BackgroundPicker setSelectedBackground={setSelectedBackground} />
			}
			actions={
				<>
					{ !autoApply && <Button
						onClick={handleApply}
						size='small'
						startIcon={<DoneIcon />}
						variant='contained'
					>
						{applyLabel()}
					</Button> }
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
