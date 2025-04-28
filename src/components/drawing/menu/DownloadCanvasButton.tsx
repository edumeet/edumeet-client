import React, { useState } from 'react';
import { Button, ButtonGroup, IconButton, Popover, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { ImageFormat } from 'fabric';

type DownloadCanvasButtonProps = {
	// eslint-disable-next-line no-unused-vars
	handleDownloadCanvasAsImage: (fileType: ImageFormat) => void;
	handleDownloadCanvasAsSvg: () => void;
	disabled: boolean;
};

const DownloadCanvasButton: React.FC<DownloadCanvasButtonProps> = (props) => {

	const { handleDownloadCanvasAsImage, handleDownloadCanvasAsSvg, disabled } = props;

	const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);

	const handleConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleDownloadAs = (fileType: string) => () => {
		if (fileType == 'svg') {
			handleDownloadCanvasAsSvg();
		} else {
			handleDownloadCanvasAsImage(fileType as ImageFormat);
		}
		setAnchorEl(null);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;

	return (
		<div style={{ display: 'inline-block' }}>
			<IconButton
				aria-describedby={id}
				onClick={handleConfirm}
				size='small'
				disabled={disabled}
			>
				<DownloadIcon />
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
				<Typography sx={{ p: 1 }} component='div'>
					<ButtonGroup 
						orientation='vertical'
						variant="contained"
					>
						
						<Button
							color="warning"
							onClick={handleDownloadAs('png')}
						>
						As Png
						</Button>
						<Button
							color="warning"
							onClick={handleDownloadAs('jpeg')}
						>
						As Jpeg
						</Button>
						<Button
							color="warning"
							onClick={handleDownloadAs('svg')}
						>
						As SVG
						</Button>
					</ButtonGroup>
				</Typography>
			</Popover>
		</div>
	);
};

export default DownloadCanvasButton;