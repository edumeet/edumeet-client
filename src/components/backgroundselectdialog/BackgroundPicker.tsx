import { CloudUpload, DeleteForever } from '@mui/icons-material';
import { Box, Button, IconButton, ImageList, ImageListItem, ImageListItemBar } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { deleteImage, getImage, loadThumbnails, saveImage } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uploadFileLabel, roomBgLabel } from '../translated/translatedComponents';

interface RoomBgTileProps {
	backgroundimage?: string;
}

const RoomBgTile = styled('img')<RoomBgTileProps>(({ theme, backgroundimage }) => ({
	height: 164,
	width: 'inherit',
	overflow: 'initial',
	background: theme.background,
	...(backgroundimage && {
		backgroundImage: `url(${backgroundimage})`
	}),
}));

type BackgroundPickerProps = {
	setSelectedBackground: React.Dispatch<React.SetStateAction<string | undefined>>,
}

const BackgroundPicker = ({ setSelectedBackground }: BackgroundPickerProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const thumbnails: ThumbnailItem[] = useAppSelector((state) => state.me.thumbnailList);
	const previousBackground: string | undefined = useAppSelector((state) => state.me.backgroundImage);
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage);

	const [ selectedItem, setSelectedItem ] = useState<{ imageName: string, imageUrl: string } | undefined>();
	const [ useRoomBackground, setUseRoomBackground ] = useState(!previousBackground);

	useEffect(() => {
		const loadThumbnailsOnMount = async () => {
			await dispatch(loadThumbnails());
		};

		loadThumbnailsOnMount();

		return () => { selectedItem?.imageUrl && URL.revokeObjectURL(selectedItem.imageUrl); };
	}, []);

	const handleSelectImage = async (item: ThumbnailItem) => {

		if (item.imageName === selectedItem?.imageName) return;

		setUseRoomBackground(false);
		const image = await dispatch(getImage(item.imageName));

		if (image) {
			selectedItem?.imageName && URL.revokeObjectURL(selectedItem.imageName);
			const imageUrlRef = URL.createObjectURL(image);

			setSelectedItem({ imageName: item.imageName, imageUrl: imageUrlRef });
			setSelectedBackground(item.imageName);
		} else {
			setSelectedItem(undefined);
		}
	};

	const handleSelectRoomBg = () => {
		setSelectedItem(undefined);
		setUseRoomBackground(true);
		setSelectedBackground('');
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
			URL.revokeObjectURL(selectedItem.imageUrl);
		}
		dispatch(deleteImage(item));
	};

	return (
		<Box
			onDrop={ handleFileDrop }
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
				{ useRoomBackground
					? <RoomBgTile
						backgroundimage={roomBackgroundImage}
						sx={{
							height: 'inherit',
							objectFit: 'cover'
						}} />
					: <Box
						component='img'
						src={selectedItem?.imageUrl ?? previousBackground}
						sx={{
							height: 'inherit',
							objectFit: 'cover'
						}}
						alt='Select an image' />
				}
			</Box>
			<Button
				sx={{
					margin: '2px'
				}}
				component="label"
				role={undefined}
				variant="contained"
				tabIndex={-1}
				startIcon={<CloudUpload />}
			>
				{ uploadFileLabel() }
				<input
					hidden
					multiple
					type='file'
					onChange={ handleFileUpload } />
			</Button>
			<ImageList sx={{ width: 'fit-content', height: 450 }} cols={4} rowHeight={164}>

				<ImageListItem
					key='room-background'
					onClick={ handleSelectRoomBg }>
					<RoomBgTile backgroundimage={roomBackgroundImage} />
					<ImageListItemBar
						sx={{
							background:
							'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
							'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
						}}
						position='top'
						title={roomBgLabel()} />
				</ImageListItem>

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
