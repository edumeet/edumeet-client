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
import { applyLabel, closeLabel, removeImagesLabel, selectBackgroundLabel, useRoomBgLabel } from '../translated/translatedComponents';
import BackgroundPicker from './BackgroundPicker';

const BackgroundSelectDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const backgroundSelectDialogOpen = useAppSelector((state) => state.ui.backgroundSelectDialogOpen);

	const [ selectedBackground, setSelectedBackground ] = useState<string | undefined>();

	useEffect(() => {
		const checkForSavedBackground = async () => {
			await dispatch(loadUserBackground());
		};

		checkForSavedBackground();
	}, []);

	const handleApply = (): void => {
		dispatch(uiActions.setUi({
			backgroundSelectDialogOpen: !backgroundSelectDialogOpen
		}));
		selectedBackground && dispatch(setUserBackground(selectedBackground));
	};

	const handleUnsetBackground = (): void => {
		dispatch(uiActions.setUi({
			backgroundSelectDialogOpen: !backgroundSelectDialogOpen
		}));
		dispatch(meActions.setBackgroundImage(''));
	};

	const handleClearStorage = (): void => {
		dispatch(clearImageStorage());
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
				<BackgroundPicker
					setSelectedBackground={setSelectedBackground}
				/>
			}
			actions={
				<>
					<Button
						onClick={handleApply}
						startIcon={<DoneIcon />}
						color='success'
						variant='contained'
						size='small'
					>
						{applyLabel()}
					</Button>
					<Button
						onClick={handleUnsetBackground}
						startIcon={<CloseIcon />}
						variant='contained'
						size='small'
					>
						{useRoomBgLabel()}
					</Button>
					<Button
						onClick={handleClearStorage}
						startIcon={<DeleteForever />}
						color='warning'
						variant='contained'
						size='small'>
						{removeImagesLabel()}
					</Button>
					<Button
						onClick={handleCloseBackgroundSelectDialog}
						startIcon={<CloseIcon />}
						variant='contained'
						size='small'
					>
						{closeLabel()}
					</Button>
				</>
			}
		/>
	);
};

export default BackgroundSelectDialog;
