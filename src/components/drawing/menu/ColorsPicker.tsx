import React, { useState } from 'react';
// import Row from './Row';
// import Menu from './Popover';
import { DrawingState } from '../../../store/slices/drawingSlice';
import { Popover } from '@mui/material';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';

interface Props {
	colorsPicker: DrawingState['colorsPicker'];
	colors: DrawingState['colors'];
	color: DrawingState['color'];
	handleUseColor: (selectedColor: DrawingState['color']) => void; // eslint-disable-line
}

const ColorsPicker: React.FC<Props> = (props) => {

	const { colors, color, handleUseColor } = props;
  
	const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	switch (props.colorsPicker) {
		case 'Row':
			return <>
				{colors.map((value) => (
					<IconButton
						key={value}
						aria-label={`Use ${value} color`}
						title={value}
						onClick={() => handleUseColor(value)}
						style={{ border: color === value ? '2px solid gray' : '2px solid lightgray' }}
						size='small'
					>
						<CircleIcon
							style={{ color: value }}
						/>
					</IconButton>
				))}
			</>;
		case 'Popover':
			return <>
				<IconButton
					onClick={handleClick}
					style={{ color: color, borderRadius: '50%' }}
					size='small'
				>
					<CircleIcon />
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
			
						{colors.map((value) => (
							<Grid
								key={value}
							>
								{value !== color &&
				<IconButton
					onClick={() => {
						handleClose();
						handleUseColor(value);
					}}
					size='small'
				>
					<CircleIcon style={{ color: value, borderRadius: '50%' }} />
				</IconButton>
								}
							</Grid>
						))}
					</Grid>
				</Popover>
			</>;
		default:
			return null;
	}

};

export default ColorsPicker;