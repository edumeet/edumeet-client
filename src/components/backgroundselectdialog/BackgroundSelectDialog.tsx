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
			: dispatch(meActions.setBackgroundImage(''));
	}, [ selectedBackground ]);

	const handleApply = (): void => {
		dispatch(uiActions.setUi({
			backgroundSelectDialogOpen: !backgroundSelectDialogOpen
		}));
		selectedBackground
			? dispatch(setUserBackground(selectedBackground))
			: dispatch(meActions.setBackgroundImage(''));
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
				<BackgroundPicker setSelectedBackground={setSelectedBackground} />
			}
			actions={
				<>
					<Button
						onClick={handleApply}
						startIcon={<DoneIcon />}
						variant='contained'
						size='small'
					>
						{applyLabel()}
					</Button>
					<Button
						onClick={handleClearStorage}
						startIcon={<DeleteForever />}
						color='secondary'
						size='small'>
						{removeAllImagesLabel()}
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
