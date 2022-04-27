import {
	Button,
	DialogActions,
	DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	CloseMessage,
	FilesharingMessage,
} from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import { FilesharingFile } from '../../utils/types';
import { sendFiles } from '../../store/actions/filesharingActions';

const FilesharingDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const filesharingOpen = useAppSelector((state) => state.ui.filesharingOpen);
	const files = useAppSelector((state) => state.filesharing);

	const handleCloseFilesharing = (): void => {
		dispatch(uiActions.setUi({
			filesharingOpen: !filesharingOpen
		}));
	};

	const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		const droppedFiles = event.dataTransfer.files;

		if (droppedFiles?.length)
			dispatch(sendFiles(droppedFiles));
	};

	const handleAttachFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const selectedFiles = event.target.files;

		if (selectedFiles?.length)
			dispatch(sendFiles(selectedFiles));
	};

	return (
		<StyledDialog
			open={filesharingOpen}
			onClose={handleCloseFilesharing}
			onDrop={handleFileDrop}
		>
			<DialogTitle>
				<FilesharingMessage />
			</DialogTitle>
			<input
				hidden
				id='file-input'
				multiple
				type='file'
				onChange={handleAttachFile}
			/>
			<label htmlFor='file-input'>
				<Button
					variant='contained'
					component='span'
				>
					<FilesharingMessage />
				</Button>
			</label>
			{files.map((file: FilesharingFile) => (
				<div key={file.magnetURI}>
					{file.magnetURI}
				</div>
			))}
			<DialogActions>
				<Button
					onClick={handleCloseFilesharing}
					startIcon={<CloseIcon />}
				>
					<CloseMessage />
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default FilesharingDialog;