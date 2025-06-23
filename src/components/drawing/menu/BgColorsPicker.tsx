import React, { useState } from 'react';
// import Row from './Row';
// import Menu from './Popover';
import { DrawingState } from '../../../store/slices/drawingSlice';
import { Grid2 as Grid, Popover } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import RectangleIcon from '@mui/icons-material/Rectangle';

interface Props {
	bgColors: DrawingState['bgColors'];
	bgColor: DrawingState['bgColor'];
	handleUseBgColor: (selectedColor: DrawingState['bgColor']) => void; // eslint-disable-line
}

const BgColorsPicker: React.FC<Props> = (props) => {

	const { bgColors, bgColor, handleUseBgColor } = props;
  
	const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	return <>
		<IconButton
			onClick={handleClick}
			style={{ color: bgColor }}
			size='small'
			
		>
			<RectangleIcon />
		</IconButton>
		<Popover
			open={open}
			anchorEl={anchorEl}
			onClose={handleClose}
			anchorOrigin={{
				horizontal: 'center',
				vertical: 'top',
			}}
			transformOrigin={{
				horizontal: 'center',
				vertical: 'bottom',
			}}
			elevation={0}
			slotProps={{
				paper: {
					style: { backgroundColor: 'transparent' },
				},
			}}
		>
	
			<Grid
				container
				spacing={0}
				direction={'column'}
				border={0}
			>
			
				{bgColors.map((value) => (
					<Grid
						key={value}
					>
						{value !== bgColor &&
				<IconButton
					onClick={() => {
						handleClose();
						handleUseBgColor(value);
					}}
					size='small'
				>
					<RectangleIcon style={{ color: value }} />
				</IconButton>
						}
					</Grid>
				))}
			</Grid>
		</Popover>
	</>;

};

export default BgColorsPicker;