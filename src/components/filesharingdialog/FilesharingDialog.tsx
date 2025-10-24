import { Button, styled } from '@mui/material';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel, shareFileLabel, startingFileSharingLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import { sendFiles } from '../../store/actions/filesharingActions';
import FilesharingList from './FilesharingList';
import { permissions } from '../../utils/roles';
import GenericDialog from '../genericdialog/GenericDialog';
import ClearFilesharingButton from '../textbuttons/ClearFilesharingButton';

const ShareLabel = styled('label')(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(1),
}));

const FilesharingDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const filesharingOpen = useAppSelector((state) => state.ui.filesharingOpen);
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);
	const isFilesharingModerator = usePermissionSelector(permissions.MODERATE_FILES);
	const startFileSharingInProgress =
		useAppSelector((state) => state.room.startFileSharingInProgress);

	const handleCloseFilesharing = (): void => {
		dispatch(uiActions.setUi({
			filesharingOpen: !filesharingOpen
		}));
	};

	const handleAttachFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const selectedFiles = event.target.files;

		if (selectedFiles?.length)
			dispatch(sendFiles(selectedFiles));
	};

	return (
		<GenericDialog
			open={filesharingOpen}
			onClose={handleCloseFilesharing}
			maxWidth='sm'
			content={
				<>
					<input
						hidden
						id='file-input'
						multiple
						type='file'
						onChange={handleAttachFile}
						disabled={!hasFilesharingPermission || startFileSharingInProgress}
					/>
					<ShareLabel htmlFor='file-input'>
						{ isFilesharingModerator && <ClearFilesharingButton /> }
						<Button
							variant='contained'
							component='span'
							disabled={!hasFilesharingPermission || startFileSharingInProgress}
						>
							{ shareFileLabel() }
						</Button>
						{ startFileSharingInProgress && startingFileSharingLabel() }
					</ShareLabel>
					<FilesharingList />
				</>
			}
			actions={
				<Button
					onClick={handleCloseFilesharing}
					startIcon={<CloseIcon />}
					variant='contained'
					size='small'
				>
					{ closeLabel() }
				</Button>
			}
		/>
	);
};

export default FilesharingDialog;
