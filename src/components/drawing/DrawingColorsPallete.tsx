import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircleIcon from '@mui/icons-material/Circle';
import { Select, MenuItem } from '@mui/material';

interface Props {
	type: string;
	paletteColors: string[];
	paletteColor: string;
	handleUsePaletteColor: (selectedColor: string) => void;
}

const ColorPicker: React.FC<Props> = (props) => {
  
	const { type, paletteColors, paletteColor, handleUsePaletteColor } = props; // eslint-disable-line

	const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	const Row: React.FC = () => {
		return <>
			{paletteColors.map((value) => (
				<IconButton
					key={value}
					aria-label={`Use ${value} color`}
					title={value}
					onClick={() => handleUsePaletteColor(value)}
					style={{ border: paletteColor === value ? '2px solid gray' : '2px solid lightgray' }}
					size='small'
				>
					<CircleIcon
						style={{ color: value }}
					/>
				</IconButton>
			))}
		</>;
	};
	const Menu: React.FC = () => {
		return <>
			<IconButton
				onClick={handleClick}
				style={{ color: paletteColor, borderRadius: '50%' }}
				size='small'
			>
				{/* <CircleIcon style={{ color: color }} /> */}
				<CircleIcon />
			</IconButton>
			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<Box p={2}>
					<Grid container spacing={1}>
						{paletteColors.map((color) => (
							<Grid item key={color}>
								<IconButton
									style={{ color: color, borderRadius: '50%' }}
									onClick={() => {
										handleClose();
										handleUsePaletteColor(color);
									}}
									size='small'
								>
									<CircleIcon style={{ color: color, borderRadius: '50%' }} />
								</IconButton>
							</Grid>
						))}
					</Grid>
				</Box>
			</Popover>
		</>;
	};

	const Menu2: React.FC = () => {
		return <>
			<Select
				value={paletteColor}
				onChange={(event) => handleUsePaletteColor(event.target.value as string)}
				style={{ border: '2px solid lightgray' }}
				size='small'
			>
				{paletteColors.map((value) => (
					<MenuItem key={value} value={value} style={{ color: value }}>
						<CircleIcon style={{ color: value }} />
					</MenuItem>
				))}
			</Select>
		</>;
	};

	switch (type) {
		case 'row':
			return <Menu />;
		case 'menu':
			return <Row />;
		case 'menu2':
			return <Menu2 />;
		default:
			return null;
	}
};

export default ColorPicker;