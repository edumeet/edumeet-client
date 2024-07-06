import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { Button, Grid, IconButton } from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteIcon from '@mui/icons-material/Delete';

const DrawingBoard: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas | null>(null);
	const [ mode, setMode ] = useState<fabric.PencilBrush | null>(null); // eslint-disable-line
	
	const palleteColors = [ 'black', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ];
	const [ palletteColor, setPalletteColor ] = useState<string>('black');
	const boardWidth = 800;
	const boardHeight = 500;
	const canvasWidth = 800;
	const canvasHeight = 450;
	const toolbarHeight = 50;
	const toolbarWidth = 532;

	const cursorSize = 5;
	const backgroundColor = 'lightgray';

	useEffect(() => {
		if (canvasRef.current) {
			setCanvas(new fabric.Canvas(canvasRef.current, {
				width: canvasWidth,
				height: canvasHeight,
				backgroundColor: backgroundColor,
				isDrawingMode: true
			}));

			return () => {
				if (canvas) {
					canvas.dispose();
				}
			};
		}

	}, []);

	useEffect(() => { handleUsePencil(); }, [ canvas, palletteColor ]);

	const handleUsePalletteColor = (selectedColor: string) => {
		setPalletteColor(selectedColor);
	};

	const handleUsePencil = () => {
		if (canvas) {
			canvas.isDrawingMode = true;
			canvas.selection = false;
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="${palletteColor}"><circle cx="${cursorSize}" cy="${cursorSize}" r="${cursorSize}"/></svg>') 5 5, auto`;
			canvas.freeDrawingBrush.color = palletteColor;
			canvas.freeDrawingBrush.width = cursorSize;
			canvas.freeDrawingBrush.strokeLineCap = 'round';
		}
	};

	const handleUseEraserTool = () => {
		if (canvas) {

			canvas.isDrawingMode = true;
			canvas.selection = false;
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="transparent" stroke="black" stroke-width="1"><circle cx="${cursorSize}" cy="${cursorSize}" r="${cursorSize}"/></svg>') 5 5, auto`;
			canvas.freeDrawingBrush.color = backgroundColor;
			canvas.freeDrawingBrush.width = cursorSize;
			canvas.freeDrawingBrush.strokeLineCap = 'round';			
		}
	};
	
	const handleUseTextTool = () => {
		if (canvas) {
			canvas.isDrawingMode = false;
			canvas.selection = false;
			canvas.forEachObject((obj) => {
				obj.selectable = false;
			});
			canvas.on('mouse:down', (event) => {
				const pointer = canvas.getPointer(event.e);
				const text = new fabric.IText('', {
					left: pointer.x,
					top: pointer.y,
					fill: palletteColor,
					fontSize: 20,
					fontFamily: 'Arial',
				});

				canvas.add(text);
				canvas.setActiveObject(text);
				text.enterEditing();
			});
		}
	};
	
	const handleUndo = () => {
		if (canvas) {
			const history = canvas.getObjects();
			
			if (history) {
				canvas.remove(history[history.length - 1]);
				canvas.renderAll();
			}
		}
	};
	
	const handleRedo = () => {
		if (canvas) {
			const history = canvas.getObjects();
			const lastRemovedObject = history[history.length - 1];
			
			if (lastRemovedObject) {
				canvas.add(lastRemovedObject);
				canvas.renderAll();
			}
		}
	};
	
	const handleEraseAll = () => {
		if (canvas) {
			canvas.clear();
			canvas.backgroundColor = backgroundColor;
		}
	};
	
	return (
		<Grid
			container
			sx={{
				width: boardWidth,
				height: boardHeight,
			}}
		>
			{/* Canvas */}
			<Grid
				item
				sx={{
					width: canvasWidth,
					height: canvasHeight
				}}
			>
				<canvas ref={canvasRef} />
			</Grid>

			{/* Tools Container */}
			<Grid
				item
				sx={{
					backgroundColor: 'lightgray',
					width: boardWidth,
					border: '1px solid gray',
				}}
			>
				{/* Tools */}
				<Grid
					item
					container
					margin={1}
					sx={{
						padding: '5px 5px',
						height: toolbarHeight,
						border: '1px solid gray',
						borderRadius: '30px',
						backgroundColor: 'lightgray',
						width: toolbarWidth,
						
					}}
				>
					<Grid
						container
						alignItems='center'
					>
						{/* Tools: Pallette */}
						<Grid item>
							{palleteColors.map((value) => (
								<div
									style={{
										border: value === palletteColor ? '1px solid gray' : '1px solid lightgray',
										borderRadius: '50%',
										margin: 0.5,
										display: 'inline-block',
									}}
								>
									<Button
										key={value}
										sx={{
											minWidth: 10,
											minHeight: 10,
											padding: 1,
											margin: 1,
											borderRadius: '50%',
											backgroundColor: value,
											opacity: value === palletteColor ? 1 : 0.5,
											'&:hover': {
												backgroundColor: value,
												opacity: 1,
											},
										}}
										variant='contained'
										onClick={() => handleUsePalletteColor(value)}
										title={value}
									/>
								</div>
							))}
						</Grid>
						{/* Tools: Rest */}
						<Grid item>
							<IconButton
								aria-label="Use Pencil"
								onClick={handleUsePencil}
								title="Use Pencil"
							>
								<DrawIcon />
							</IconButton>
							<IconButton
								aria-label="Use Eraser Tool"
								onClick={handleUseEraserTool}
								title="Use Eraser Tool"
							>
								<AutoFixNormalIcon />
							</IconButton>
							<IconButton
								aria-label="Use Text Tool"
								onClick={handleUseTextTool}
								title="Use Text Tool"
							>
								<AbcIcon />
							</IconButton>
							<IconButton
								aria-label="Undo"
								onClick={handleUndo}
								title="Undo"
							>
								<UndoIcon/>
							</IconButton>
							<IconButton
								aria-label="Redo"
								onClick={handleRedo}
								title="Redo"
							>
								<RedoIcon/>
							</IconButton>
							<IconButton
								aria-label="Erase All"
								onClick={handleEraseAll}
								title="Erase All"
							>
								<DeleteIcon />
							</IconButton>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingBoard;
