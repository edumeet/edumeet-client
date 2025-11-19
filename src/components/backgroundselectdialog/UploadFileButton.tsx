import { CloudUpload } from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';
import { uploadFileLabel } from '../translated/translatedComponents';
import { saveImage } from '../../store/actions/meActions';
import { useAppDispatch } from '../../store/hooks';
import { ThumbnailItem } from '../../services/clientImageService';

interface UploadFileButtonProps {
	// eslint-disable-next-line no-unused-vars
	afterImageUploadHook?: (uploadedThumbnailItem: ThumbnailItem) => unknown;
}

export const UploadImageButton = ({ afterImageUploadHook }: UploadFileButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files: FileList | null = event.target.files;

		if (!files?.length) return;

		let newThumbnail;

		for (const file of files) {
			newThumbnail = await dispatch(saveImage(file));
		}

		if (newThumbnail) afterImageUploadHook?.(newThumbnail);
	};

	return (
		<Button
			component="label"
			role={undefined}
			size='small'
			startIcon={<CloudUpload />}
			variant="contained"
		>
			{ uploadFileLabel() }
			<input
				hidden
				multiple
				onChange={ handleFileUpload }
				type='file' />
		</Button>
	);
};

export default UploadImageButton;