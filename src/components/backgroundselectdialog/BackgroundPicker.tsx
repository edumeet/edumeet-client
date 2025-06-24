import { DeleteForever } from '@mui/icons-material';
import { Box, IconButton, ImageList, ImageListItem, ImageListItemBar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect } from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { deleteImage, getImage, loadThumbnails } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { defaultLabel, noneLabel } from '../translated/translatedComponents';
import DropZone from './DropZone';
import { RoomBgTile } from './RoomBackgroundTile';

export interface SelectedBackground {
	imageName: string,
	imageUrl: string
}

const NoneTile = (): React.JSX.Element => {
	return (<Box height={164} width={150} />);
};

type BackgroundPickerProps = {
	selectedBackground: SelectedBackground | null,
	// eslint-disable-next-line no-unused-vars
	setSelectedBackground: (selected: SelectedBackground | null) => void,
	children?: React.ReactNode,
	defaultTile?: React.ReactNode
}

const BackgroundPicker = ({ selectedBackground, setSelectedBackground, defaultTile, children }: BackgroundPickerProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isMd = useMediaQuery(theme.breakpoints.up('md'));
	const isSm = useMediaQuery(theme.breakpoints.up('sm'));
	const thumbnails: ThumbnailItem[] = useAppSelector((state) => state.me.thumbnailList);

	useEffect(() => {
		const loadThumbnailsOnMount = async () => {
			await dispatch(loadThumbnails());
		};

		loadThumbnailsOnMount();

		return () => { selectedBackground?.imageUrl && URL.revokeObjectURL(selectedBackground.imageUrl); };
	}, []);

	const handleSelectImage = async (item: ThumbnailItem) => {

		if (item.imageName === selectedBackground?.imageName) return;

		const image = await dispatch(getImage(item.imageName));

		if (image) {
			selectedBackground?.imageName && URL.revokeObjectURL(selectedBackground.imageName);
			const imageUrlRef = URL.createObjectURL(image);

			setSelectedBackground({ imageName: item.imageName, imageUrl: imageUrlRef });
		} else {
			setSelectedBackground(null);
		}
	};

	const handleOnDelete = async (item: ThumbnailItem) => {
		if (selectedBackground?.imageName === item.imageName) {
			URL.revokeObjectURL(selectedBackground.imageUrl);
		}
		dispatch(deleteImage(item));
	};

	return (
		<DropZone afterImageDropHook={handleSelectImage}>
			{children}
			<br />
			<ImageList
				sx={{
					width: 'fit-content',
					margin: 'auto',
					height: '100%',
				}}
				cols={isMd ? 5 : (isSm ? 3 : 2)}
				rowHeight={164}>

				<ImageListItem
					key='default-background'
					onClick={() => setSelectedBackground(null)}>
					{defaultTile ?? <NoneTile />}
					<ImageListItemBar
						sx={{
							background:
								'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, ' +
								'rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
						}}
						position='top'
						title={defaultTile ? defaultLabel() : noneLabel()} />
				</ImageListItem>
			</ImageList>
			<br />
			<ImageList
				sx={{
					width: 'fit-content',
					margin: 'auto',
					height: '100%',
				}}
				cols={isMd ? 5 : (isSm ? 3 : 2)}
				rowHeight={164}>
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
						<RoomBgTile backgroundImage={item.thumbnailUrl} />
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
