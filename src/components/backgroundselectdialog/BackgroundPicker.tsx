import { DeleteForever } from '@mui/icons-material';
import { Box, IconButton, ImageList, ImageListItem, ImageListItemBar, Input, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { deleteImage, getImage, loadThumbnails, saveImage } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

type BackgroundProps = {
	setSelectedBackground: React.Dispatch<React.SetStateAction<string | undefined>>
}

const BackgroundPicker = ({ setSelectedBackground }: BackgroundProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const thumbnails: ThumbnailItem[] = useAppSelector((state) => state.me.thumbnailList);
	const previousBackground: string | undefined = useAppSelector((state) => state.me.backgroundImage);

	const [ selectedItem, setSelectedItem ] = useState<{ imageName: string, imageUrl: string } | undefined>();

	useEffect(() => {
		const loadThumbnailsOnMount = async () => {
			await dispatch(loadThumbnails());
		};

		loadThumbnailsOnMount();

		return () => { selectedItem?.imageUrl && URL.revokeObjectURL(selectedItem.imageUrl); };
	}, []);

	const handleSelectImage = async (item: ThumbnailItem) => {

		if (item.imageName === selectedItem?.imageName) return;

		const image = await dispatch(getImage(item.imageName));

		if (image) {
			const imageUrlRef = URL.createObjectURL(image);

			setSelectedItem({ imageName: item.imageName, imageUrl: imageUrlRef });
			setSelectedBackground(item.imageName);
		} else {
			setSelectedItem(undefined);
		}
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files: FileList | null = event.target.files;

		if (files?.length) saveFiles(files);
	};

	const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const droppedFiles: FileList | null = event.dataTransfer.files;

		if (droppedFiles?.length) saveFiles(droppedFiles);
	};

	const saveFiles = async (fileList: FileList) => {
		let newThumbnail;

		for (const file of fileList) {
			newThumbnail = await dispatch(saveImage(file));
		}

		newThumbnail && await handleSelectImage(newThumbnail);
	};

	const handleOnDelete = async (item: ThumbnailItem) => {
		if (selectedItem?.imageName === item.imageName) {
			setSelectedItem(undefined);
		}
		dispatch(deleteImage(item));
	};

	return (
		<Box
			onDrop={handleFileDrop}
			onDragOver={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}>
			<Box
				sx={{
					width: '100%',
					height: 328,
					border: '1px dashed #ccc',
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<Box
					component='img'
					src={selectedItem?.imageUrl ?? previousBackground}
					sx={{
						height: 328,
						objectFit: 'cover'
					}}
					alt='Select an image' />
			</Box>
			<Input type='file' inputProps={{ multiple: true }} fullWidth onChange={handleFileUpload} />
			<Typography variant='h6'>Thumbnails</Typography>
			<ImageList sx={{ width: 'fit-content', height: 450 }} cols={4} rowHeight={164}>
				{thumbnails.map((item) => (
					<ImageListItem
						key={item.imageName}
						onClick={() => handleSelectImage(item)}
						sx={{
							position: 'relative',
							'&:hover .hover-bar': {
								opacity: 1,
							},
						}}>
						<img
							srcSet={item.thumbnailUrl}
							alt={item.imageName}
							loading='lazy'
						/>
						<ImageListItemBar
							title={item.imageName}
							className='hover-bar'
							actionIcon={
								<IconButton
									onClick={(event) => {
										event.stopPropagation();
										handleOnDelete(item);
									}}
									aria-label={`delete ${item.imageName}`}
								>
									<DeleteForever htmlColor='red' />
								</IconButton>
							}
							sx={{
								position: 'absolute',
								bottom: 0,
								left: 0,
								right: 0,
								opacity: 0,
								pointerEvents: 'auto'
							}}
						/>
					</ImageListItem>
				))}
			</ImageList>
		</Box>
	);
};

export default BackgroundPicker;
