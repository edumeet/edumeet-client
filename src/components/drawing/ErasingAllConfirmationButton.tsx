import React, { useEffect, useState } from 'react';
import { Button, IconButton, Popover, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type ErasingAllConfirmationButtonProps = {
	handleEraseAll: () => void;
};

const ErasingAllConfirmationButton: React.FC<ErasingAllConfirmationButtonProps> = (props) => {

	const { handleEraseAll } = props;

	const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);
	const [ confirmed, setConfirmed ] = useState<boolean>(false);

	const handleConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleConfirmed = () => {
		setConfirmed(true);
		setAnchorEl(null);
	};

	useEffect(() => {
		if (confirmed) {
			handleEraseAll();
			setConfirmed(false);
		}
	}, [ confirmed ]);

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;

	return (
		<div style={{ display: 'inline-block' }}>
			<IconButton onClick={handleConfirm} aria-describedby={id}>
				<DeleteIcon />
			</IconButton>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'center',
				}}
				transformOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
			>
				<Typography sx={{ p: 1 }}>
					<Button
						variant="contained"
						color="warning"
						onClick={handleConfirmed}
					>
						Confirm
					</Button>
				</Typography>
			</Popover>
		</div>
	);
};

export default ErasingAllConfirmationButton;