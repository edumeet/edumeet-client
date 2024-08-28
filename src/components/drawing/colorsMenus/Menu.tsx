import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';
import { Popover, Grid } from '@mui/material';
import { useState } from 'react';
import { RoomState } from '../../../store/slices/roomSlice';

interface Props {
	colors: RoomState['drawing']['colors'];
	color: RoomState['drawing']['color'];
	handleUseColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const Menu: React.FC<Props> = (props) => {
  
	const { colors, color, handleUseColor } = props;
	
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
						item
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

};

export default Menu;