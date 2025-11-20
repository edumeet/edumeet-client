import React from 'react';
import { Divider, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import PanToolIcon from '@mui/icons-material/PanTool';
import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import ErasingAllConfirmationButton from './ErasingAllConfirmationButton';
import ColorsPicker from './ColorsPicker';
import BgColorsPicker from './BgColorsPicker';
import { DrawingState } from '../../../store/slices/drawingSlice';

interface drawingMenuProps {
    menuRef: React.RefObject<HTMLDivElement>
    size: number
    sizeRange: {
        min: number;
        max: number;
    } | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tool: any
    handleUseMoveTool: () => void
    handleUsePencilBrush: () => void
    handleUseEraserTool: () => void
    handleUseTextTool: () => void
    // eslint-disable-next-line no-unused-vars
    handleChangeSize: (e: React.MouseEvent<HTMLButtonElement>, operation: 'inc' | 'dec') => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    colorsPicker: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    colors: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    color: any
    // eslint-disable-next-line no-unused-vars
    handleUseColor: (selectedColor: DrawingState['color']) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bgColors: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bgColor: any
    // eslint-disable-next-line no-unused-vars
    handleUseBgColor: (selectedColor: DrawingState['bgColor']) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pastActions: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    futureActions: any
    handleUndo: () => void
    handleRedo: () => void
    handleEraseAll: () => void
}

const DrawingMenu = ({ 
	menuRef, 
	size,
	sizeRange,
	tool,
	handleUseMoveTool,
	handleUsePencilBrush,
	handleUseEraserTool,
	handleUseTextTool,
	handleChangeSize,
	colorsPicker,
	colors,
	color,
	handleUseColor,
	bgColors,
	bgColor,
	handleUseBgColor,
	pastActions,
	futureActions,
	handleUndo,
	handleRedo,
	handleEraseAll
}:drawingMenuProps): React.JSX.Element => {

	return (
		<Grid container
			sx={{
				borderTop: '1px solid gray',
				backgroundColor: 'lightgray',
			}}
			justifyContent='center'
			ref={menuRef}
			direction='row'
			wrap='nowrap'
			size={{ xs: 12 }}
		>
			{/* Toolbar */}
			<Grid
				container	
				margin={1}
				border={1}
				borderColor={'gray'}
				borderRadius={6}
				padding={0.6}
				wrap='nowrap'
				gap={0.5}
			>
					
				{/* Draw */} <Divider orientation="vertical" sx={{ display: 'none' }} />

				<Grid
					container
					size = {{ xs: 'auto' }}
					wrap='nowrap'
				>
					{/* Move */}
					<IconButton
						aria-label="Use move Tool"
						onClick={handleUseMoveTool}
						title="Use Move Tool"
						style={{ border: tool === 'move' ? '2px solid gray' : '2px solid lightgray' }}
						size='small'
					>
						<PanToolIcon />
					</IconButton>

					{/* PencilBrush */}
					<IconButton
						aria-label="Use Pencil Brush Tool"
						onClick={handleUsePencilBrush}
						title="Use Pencil Brush Tool"
						style={{ border: tool === 'pencilBrush' ? '2px solid gray' : '2px solid lightgray' }}
						size='small'
					>
						<DrawIcon />
					</IconButton>

					{/* Text */}
					<IconButton
						aria-label="Use Text Tool"
						onClick={handleUseTextTool}
						title="Use Text Tool"
						style={{ border: tool === 'text' ? '2px solid gray' : '2px solid lightgray' }}
						size='small'
					>
						<AbcIcon />
					</IconButton>

					{/* Eraser */}
					<IconButton
						aria-label="Use Eraser Tool"
						onClick={handleUseEraserTool}
						title="Use Eraser Tool"
						style={{ border: tool === 'eraser' ? '2px solid gray' : '2px solid lightgray' }}
						size='small'
					>
						<AutoFixNormalIcon />
					</IconButton>
				</Grid>

				{ /* Size */ } <Divider orientation="vertical" />

				<Grid
					container
					size = {{ xs: 'auto' }}
				>
					{/* Increase Size */}
					<IconButton
						aria-label="Increase Size"
						onClick={(e) => handleChangeSize(e, 'inc')}
						onMouseDown={(e) => handleChangeSize(e, 'inc')}
						onMouseUp={(e) => handleChangeSize(e, 'inc')}
						onMouseLeave={(e) => handleChangeSize(e, 'inc')}
						disabled={sizeRange && size === sizeRange.max}
						title="Increase Size"
						size='small'
					>
						<AddCircleOutlineIcon />
					</IconButton>

					{/* Size Label */}
					<Typography 
						variant="caption" 
						width={20}
						display="flex" 
						alignItems="center" 
						justifyContent="center"
					>
						{size}
					</Typography>
						
					{/* Decrease Size */}
					<IconButton
						aria-label="Decrease Size"
						onClick={(e) => handleChangeSize(e, 'dec')}
						onMouseDown={(e) => handleChangeSize(e, 'dec')}
						onMouseUp={(e) => handleChangeSize(e, 'dec')}
						onMouseLeave={(e) => handleChangeSize(e, 'dec')}
						disabled={sizeRange && size === sizeRange.min}
						title="Decrease Size"
						size='small'
					>
						<RemoveCircleOutlineIcon />
					</IconButton>
				</Grid>

				{/* Colors */} <Divider orientation="vertical" />

				<Grid
					container
					size = {{ xs: 'auto' }}
				>							
					<ColorsPicker
						colorsPicker={colorsPicker}
						colors={colors}
						color={color}
						handleUseColor={handleUseColor}
					/>
				</Grid>

				{/* BgColors */} <Divider orientation="vertical" />

				<Grid
					container
					size = {{ xs: 'auto' }}
				>							
					<BgColorsPicker
						bgColors={bgColors}
						bgColor={bgColor}
						handleUseBgColor={handleUseBgColor}
					/>
				</Grid>

				{/* History */} <Divider orientation="vertical" />

				<Grid
					container
					size = {{ xs: 'auto' }}
					sx = {{ justifyContent: 'flex-end' }}
					wrap='nowrap'

				>
					{/* Undo */}
					<IconButton
						aria-label="Undo"
						onClick={handleUndo}
						title="Undo"
						size='small'
						disabled={pastActions.length === 0}
					>
						<UndoIcon />
						<sub>{pastActions.length}</sub>
					</IconButton>

					{/* Redo */}
					<IconButton
						aria-label="Redo"
						onClick={handleRedo}
						title="Redo"
						size='small'
						disabled={futureActions.length === 0}
					>
						<RedoIcon />
						<sub>{futureActions.length}</sub>
					</IconButton>
						
					{/* Erase All */}
					<ErasingAllConfirmationButton
						handleEraseAll={handleEraseAll}
						disabled={pastActions.length === 0 && futureActions.length === 0}

					/>
						
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingMenu;
