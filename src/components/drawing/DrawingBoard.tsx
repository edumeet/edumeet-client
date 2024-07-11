import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { Grid, IconButton } from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import CircleIcon from '@mui/icons-material/Circle';
import ErasingAllConfirmationButton from './ErasingAllConfirmationButton';

const DrawingBoard: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas | null>(null);
	const [ currentTool, setCurrentTool ] = useState<string>('brush');
	
	const [mode, setMode] = useState<fabric.PencilBrush | null>(null); // eslint-disable-line
	const historyRedo: fabric.Object[] = [];
	
	const paletteColors = [ 'black', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ];
	const [ paletteColor, setPaletteColor ] = useState<string>('black');
	const boardWidth = 800;
	const boardHeight = 500;
	const canvasWidth = 800;
	const canvasHeight = 440;
	const toolbarHeight = 60;
	const toolbarWidth = 750;

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

	useEffect(() => {
		if (currentTool === 'brush')
			handleUsePencil();
		else if (currentTool === 'text')
			handleUseTextTool();
	}, [ canvas, paletteColor ]);

	const handleUsePaletteColor = (selectedColor: string) => {
		setPaletteColor(selectedColor);
	};

	const handleUsePencil = () => {
		if (canvas) {
			canvas.isDrawingMode = true;
			canvas.selection = false;
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="${paletteColor}"><circle cx="${cursorSize}" cy="${cursorSize}" r="${cursorSize}"/></svg>') 5 5, auto`;
			canvas.freeDrawingBrush.color = paletteColor;
			canvas.freeDrawingBrush.width = cursorSize;
			canvas.freeDrawingBrush.strokeLineCap = 'round';

			setCurrentTool('brush');
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

			setCurrentTool('eraser');
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
					fill: paletteColor,
					fontSize: 20,
					fontFamily: 'Arial',
				});

				canvas.add(text);
				canvas.setActiveObject(text);
				text.enterEditing();
				
			});

			setCurrentTool('text');
		}
	};
	
	const handleUndo = () => {
		if (canvas) {
			const history = canvas.getObjects();
			
			if (history) {
				historyRedo.push(history[history.length - 1]);
				canvas.remove(history[history.length - 1]);
				canvas.renderAll();
			}
		}
	};
	
	const handleRedo = () => {
		if (canvas) {
			const last = historyRedo.pop();
			
			if (last) {
				canvas.add(last);
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
						justifyContent='space-around'
					>
						{/* Tools: Palette */}
						<Grid item>
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
						</Grid>
						{/* Tools: Basic */}
						<Grid item>
							<IconButton
								aria-label="Use Pencil"
								onClick={handleUsePencil}
								title="Use Pencil"
								style={{ border: currentTool === 'brush' ? '2px solid gray' : '2px solid lightgray' }}
								size='small'
							>
								<DrawIcon
									style={{ color: currentTool === 'brush' ? paletteColor : 'inherit' }}
								/>
							</IconButton>
							<IconButton
								aria-label="Use Eraser Tool"
								onClick={handleUseEraserTool}
								title="Use Eraser Tool"
								style={{ border: currentTool === 'eraser' ? '2px solid gray' : '2px solid lightgray' }}
								size='small'
							>
								<AutoFixNormalIcon />
							</IconButton>
							<IconButton
								aria-label="Use Text Tool"
								onClick={handleUseTextTool}
								title="Use Text Tool"
								style={{ border: currentTool === 'text' ? '2px solid gray' : '2px solid lightgray' }}
								size='small'
							>
								<AbcIcon
									style={{ color: currentTool === 'text' ? paletteColor : 'inherit' }}
								/>
							</IconButton>
						</Grid>
						{/* Tools: Undo, Redo, Erase All */}
						<Grid item>
							<IconButton
								aria-label="Undo"
								onClick={handleUndo}
								title="Undo"
								size='small'
							>
								<UndoIcon/>
							</IconButton>
							<IconButton
								aria-label="Redo"
								onClick={handleRedo}
								title="Redo"
								size='small'
							>
								<RedoIcon/>
							</IconButton>
							<ErasingAllConfirmationButton handleEraseAll={handleEraseAll} />
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingBoard;
