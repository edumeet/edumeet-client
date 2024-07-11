import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';
import { Popover, Box, Grid } from '@mui/material';
import { useState } from 'react';

interface Props {
	type: string;
	paletteColors: string[];
	paletteColor: string;
	handleUsePaletteColor: (selectedColor: string) => void;
}

const Menu: React.FC<Props> = (props) => {
  
	const { type, paletteColors, paletteColor, handleUsePaletteColor } = props; // eslint-disable-line

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

export default Menu;