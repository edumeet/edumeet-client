import { Box } from '@mui/material';
import React from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { saveImage } from '../../store/actions/meActions';
import { useAppDispatch } from '../../store/hooks';

interface UploadFileButtonProps {
	// eslint-disable-next-line no-unused-vars
	afterImageDropHook: (droppedThumbnailItem: ThumbnailItem) => unknown;
	children?: React.ReactNode;
}

export const DropZone = ({ afterImageDropHook, children }: UploadFileButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const droppedFiles: FileList | null = event.dataTransfer.files;

		if (!droppedFiles?.length) return;

		let newThumbnail;

		for (const file of droppedFiles) {
			newThumbnail = await dispatch(saveImage(file));
		}

		if (newThumbnail) await afterImageDropHook(newThumbnail);
	};

	return (
		<Box
			onDrop={handleFileDrop}
			onDragOver={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}>
			{children}
		</Box>
	);
};

export default DropZone;