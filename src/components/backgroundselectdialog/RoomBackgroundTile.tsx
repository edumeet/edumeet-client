import { styled } from '@mui/material';
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';

interface RoomBgTileProps {
	backgroundImage?: string;
}

export const RoomBgTile = styled('img')<RoomBgTileProps>(({ backgroundImage }) => ({
	height: '164px',
	width: '150px',
	backgroundSize: 'cover',
	objectFit: 'contain',
	overflow: 'initial',
	backgroundPosition: 'center',
	...(backgroundImage && {
		backgroundImage: `url(${backgroundImage})`
	}),
}));

export const RoomBackgroundTile = (): React.JSX.Element => {
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage) || edumeetConfig.theme.backgroundImage;

	return (
		<RoomBgTile backgroundImage={roomBackgroundImage} />
	);
};

export default RoomBackgroundTile;