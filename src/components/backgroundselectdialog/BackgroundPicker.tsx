import React, { useEffect, useRef, useState } from 'react';
import { ThumbnailItem } from '../../services/clientImageService';
import { getImage, loadThumbnails, saveImage } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Logger } from '../../utils/Logger';

type BackgroundProps = {
	setSelectedBackground: React.Dispatch<React.SetStateAction<string | undefined>>
}

const BackgroundPicker = ({ setSelectedBackground }: BackgroundProps): JSX.Element => {
	const logger = new Logger('BackgroundPicker.tsx');
	const dispatch = useAppDispatch();
	const thumbnails: ThumbnailItem[] = useAppSelector((state) => state.me.thumbnailList);

	const [ selectedImage, setSelectedImage ] = useState<string | undefined>();

	useEffect(() => {
		const loadThumbnailsOnMount = async () => {
			await dispatch(loadThumbnails());
		};

		loadThumbnailsOnMount();
	}, []);

	const imageUrlRef = useRef('');
	const handleSelectImage = async (name: string) => {
		URL.revokeObjectURL(imageUrlRef.current);
		const image = await dispatch(getImage(name));

		if (image) {
			imageUrlRef.current = image;

			setSelectedImage(imageUrlRef.current);
			setSelectedBackground(name);
		} else {
			setSelectedImage('');
			logger.error('Failed to get image.');
		}
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();
		const file: File | undefined = event.target.files?.[0];

		if (!file) return;

		const newThumbnail = await dispatch(saveImage(file));

		await handleSelectImage(newThumbnail.imageName);
	};

	return (
		<div>
			<h2>Image Gallery</h2>
			<input type='file' accept='image/*' onChange={handleFileUpload} />
			{selectedImage && (
				<div>
					<h3>Selected Image</h3>
					<img src={selectedImage} alt='selected-background' width='400' />
				</div>
			)}
			<h3>Thumbnails</h3>
			<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
				{thumbnails.map((item) => (
					<img
						key={item.imageName}
						src={item.thumbnailUrl}
						alt='Thumbnail'
						width='100'
						height='100'
						onClick={() => handleSelectImage(item.imageName)}
						style={{ cursor: 'pointer', border: '1px solid #ccc' }}
					/>
				))}
			</div>
		</div>
	);
};

export default BackgroundPicker;
