import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import { currentlySelectedLabel, selectBackgroundLabel } from '../translated/translatedComponents';

type RoomBackgroundPreviewProps = {
	selectedBackground?: string,
}

export const RoomBackgroundPreview = ({ selectedBackground }: RoomBackgroundPreviewProps): React.JSX.Element => {
	const theme = useTheme();
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage) || edumeetConfig.theme.backgroundImage;
	const previousBackground = useAppSelector((state) => state.me.selectedDestop?.imageUrl);

	return (
		<Box
			sx={{
				height: 328,
				width: '100%',
				display: 'flex',
				justifyContent: 'center',
				position: 'relative',
			}}
		>
			{ !previousBackground ? (
				roomBackgroundImage && <Box
					component='img'
					src={roomBackgroundImage||''}
					sx={{
						height: 'inherit',
						width: '100%',
						objectFit: 'contain',
						display: 'block',
					}}
					alt={selectBackgroundLabel()}
				/>					
			) : (
				<Box
					component='img'
					src={selectedBackground ?? previousBackground}
					sx={{
						height: 'inherit',
						width: '100%',
						objectFit: 'contain',
						display: 'block',
					}}
					alt={selectBackgroundLabel()}
				/>
			)}

			<Box
				sx={{
					position: 'absolute',
					top: theme.spacing(1),
					backgroundColor: `${theme.palette.primary.main}AA`,
					color: theme.palette.primary.contrastText,
					px: 2,
					py: 0.5,
				}}
			>
				{currentlySelectedLabel()}
			</Box>
		</Box>
	);
};

export default RoomBackgroundPreview;
