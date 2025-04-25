import { styled } from '@mui/material';
import React from 'react';
import { useAppSelector } from '../../store/hooks';

interface RoomBgTileProps {
	backgroundImage?: string;
}

const RoomBgTile = styled('img')<RoomBgTileProps>(({ theme, backgroundImage }) => ({
	height: 'inherit',
	width: 'inherit',
	objectFit: 'cover',
	overflow: 'initial',
	background: theme.background,
	...(backgroundImage && {
		backgroundImage: `url(${backgroundImage})`
	}),
}));

export const RoomBackgroundTile = (): React.JSX.Element => {
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage);

	return (
		<RoomBgTile backgroundImage={roomBackgroundImage} />
	);
};

export default RoomBackgroundTile;