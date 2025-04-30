import { DeleteForever } from '@mui/icons-material';
import { Box, IconButton, ImageList, ImageListItem, ImageListItemBar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { deleteImage, getImage, loadThumbnails } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { currentlySelectedLabel, defaultLabel, selectBackgroundLabel } from '../translated/translatedComponents';
import DropZone from './DropZone';
import RoomBackgroundTile from './RoomBackgroundTile';

type BackgroundPickerProps = {
	setSelectedBackground: React.Dispatch<React.SetStateAction<string | undefined>>,
}

const BackgroundPicker = ({ setSelectedBackground }: BackgroundPickerProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isMd = useMediaQuery(theme.breakpoints.up('md'));
	const thumbnails: ThumbnailItem[] = useAppSelector((state) => state.me.thumbnailList);
	const previousBackground: string | undefined = useAppSelector((state) => state.me.backgroundImage);

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

	const handleOnDelete = async (item: ThumbnailItem) => {
		if (selectedItem?.imageName === item.imageName) {
			setSelectedItem(undefined);
			URL.revokeObjectURL(selectedItem.imageUrl);
		}
		dispatch(deleteImage(item));
	};

	return (
		<DropZone afterImageDropHook={handleSelectImage}>
			<Box
				sx={{
					height: 328,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					position: 'relative',
				}}
			>
				{useRoomBackground ? (
					<RoomBackgroundTile />
				) : (
					<Box
						component='img'
						src={selectedItem?.imageUrl ?? previousBackground}
						sx={{
							height: 'inherit',
							width: '100%',
							objectFit: 'cover',
							display: 'block',
						}}
						alt={selectBackgroundLabel()}
					/>
				)}

				<Box
					sx={{
						position: 'absolute',
						top: theme.spacing(1),
						left: theme.spacing(1),
						backgroundColor: `${theme.palette.primary.main}AA`,
						color: theme.palette.primary.contrastText,
						px: 2,
						py: 0.5,
					}}
				>
					{currentlySelectedLabel()}
				</Box>
			</Box>

			<ImageList
				sx={{
					width: 'fit-content',
					height: '100%',
				}}
				cols={isMd ? 5 : 3}
				rowHeight={164}>

				<ImageListItem
					key='room-background'
					onClick={handleSelectRoomBg}>
					<RoomBackgroundTile />
					<ImageListItemBar
						sx={{
							background:
								'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
								'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
						}}
						position='top'
						title={defaultLabel()} />
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
									<DeleteForever htmlColor='secondary' />
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
		</DropZone>
	);
};

export default BackgroundPicker;
