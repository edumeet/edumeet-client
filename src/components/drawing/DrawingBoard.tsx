import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { Box, Grid, IconButton, MenuItem, Select } from '@mui/material'; // eslint-disable-line
import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ErasingAllConfirmationButton from './ErasingAllConfirmationButton';
import DrawingColorsPallete from './DrawingColorsPallete';

const DrawingBoard: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas | null>(null);
	const [ canvasWidth, setCanvasWidth ] = useState<number>(); // eslint-disable-line
	const [ canvasHeight, setCanvasHeight ] = useState<number>(); // eslint-disable-line
	
	const [ mode, setMode ] = useState<string>([ 'brush', 'text', 'eraser' ][0]);
	const [ size, ] = useState<number>(5);
	const [ colorsMenu, ] = useState<string>([ 'Row', 'Menu1', 'Menu2' ][0]);
	const [ colors, ] = useState<string[]>([ 'black', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ]);
	const [ color, setColor ] = useState<string>(colors[0]);
	const [ bgColors, ] = useState<string[]>([ 'lightgray', 'black' ]);
	const [ bgColor, ] = useState<string>(bgColors[0]);
	
	const historyRedo: fabric.Object[] = [];
	// const [ historyUndoCount, setHistoryUndoCount ] = useState<number>(999); 
	// const [ historyRedoCount, setHistoryRedoCount ] = useState<number>(999);
	
	useEffect(() => {
		if (canvasRef.current) {
			const newCanvas = new fabric.Canvas(canvasRef.current, {
				backgroundColor: bgColor,
				isDrawingMode: true
			});

			const resizeCanvas = () => {
		
				const windowInnerWidth = window.innerWidth;
				const calculatedHeight = (windowInnerWidth / 16 * 9);
				const scaleFactor = Math.min(windowInnerWidth / 1920, window.innerHeight / 1080);

				newCanvas.setWidth(windowInnerWidth);
				newCanvas.setHeight(calculatedHeight);
				newCanvas.setZoom(scaleFactor);
				newCanvas.renderAll();
				
				setCanvasWidth(windowInnerWidth);
				setCanvasHeight(calculatedHeight);
		
				// newCanvas.setWidth(originalWidth * scaleFactor);
				// newCanvas.setHeight(originalHeight * scaleFactor);
				// newCanvas.setZoom(scaleFactor);
				
				// setCanvasFactor(scaleFactor);
				// setCanvasWidth(`${originalWidth * scaleFactor}px`);
				// setCanvasHeight(`${originalHeight * scaleFactor}px`);
				newCanvas.renderAll();
			};

			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);
			
			// Event listener for object addition
			/*
			newCanvas.on('object:added', () => {
				setHistoryUndoCount(newCanvas.getObjects().length);
				setHistoryRedoCount(historyRedoCount + 1);
			});

			// Event listener for object modifications
			newCanvas.on('object:modified', () => {
				setHistoryUndoCount(newCanvas.getObjects().length);
			});

			// Event listener for object removal
			newCanvas.on('object:removed', () => {
				setHistoryUndoCount(newCanvas.getObjects().length);

				setHistoryRedoCount(historyRedoCount + 1);
			});
			*/

			setCanvas(newCanvas);
			
			return () => {
				if (canvas) {
					canvas.dispose();
					window.removeEventListener('resize', resizeCanvas);
				}
			};
			
		}

	}, []);

	useEffect(() => {
		if (mode === 'brush')
			handleUsePencil();
		else if (mode === 'text')
			handleUseTextTool();
	}, [ canvas, color ]);

	const handleUsePaletteColor = (selectedColor: string) => {
		setColor(selectedColor);
	};

	const handleUsePencil = () => {
		if (canvas) {
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingBrush.color = color;
			canvas.freeDrawingBrush.width = size;
			canvas.freeDrawingBrush.strokeLineCap = 'round';
			canvas.freeDrawingCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="${color}"><circle cx="${size}" cy="${size}" r="${size}"/></svg>') 5 5, auto`;
			canvas.isDrawingMode = true;
			canvas.selection = false;

			setMode('brush');
		}
	};

	const handleUseEraserTool = () => {
		if (canvas) {
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingBrush.color = bgColor;
			canvas.freeDrawingBrush.width = size;
			canvas.freeDrawingBrush.strokeLineCap = 'round';			
			canvas.freeDrawingCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="transparent" stroke="black" stroke-width="1"><circle cx="${size}" cy="${size}" r="${size}"/></svg>') 5 5, auto`;
			canvas.isDrawingMode = true;
			canvas.selection = false;

			setMode('eraser');
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
					fill: color,
					fontSize: 20,
					fontFamily: 'Arial',
				});

				canvas.add(text);
				canvas.setActiveObject(text);
				text.enterEditing();
				
			});

			setMode('text');
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
			canvas.backgroundColor = bgColor;
		}
	};

	return (
		<Grid container>
			{/* Main */}
			<Grid item>
				{/* Canvas */}
				<Box ref={canvasRef} component="canvas" />
			</Grid>

			{/* Menu */}
			<Grid item
				xs={12}
				sx={{
					borderTop: '1px solid gray',
					backgroundColor: 'lightgray',
				}}
			>
				{/* Tools */}
				<Grid
					item
					container
					margin={1}
					sx={{
						padding: '5px 5px',
						border: '1px solid gray',
						borderRadius: '30px',
						backgroundColor: 'lightgray',
					}}
					justifyContent='space-around'
				>
					{/* Tools: Basic */}
					<Grid item>
						<IconButton
							aria-label="Use Pencil"
							onClick={handleUsePencil}
							title="Use Pencil"
							style={{ border: mode === 'brush' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<DrawIcon
								style={{ color: mode === 'brush' ? color : 'inherit' }}
							/>
						</IconButton>
						<IconButton
							aria-label="Use Text Tool"
							onClick={handleUseTextTool}
							title="Use Text Tool"
							style={{ border: mode === 'text' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<AbcIcon
								style={{ color: mode === 'text' ? color : 'inherit' }}
							/>
						</IconButton>
						<IconButton
							aria-label="Use Eraser Tool"
							onClick={handleUseEraserTool}
							title="Use Eraser Tool"
							style={{ border: mode === 'eraser' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<AutoFixNormalIcon />
						</IconButton>
						{/* Palette Color Menu */}
						<DrawingColorsPallete
							type={colorsMenu}
							paletteColors={colors}
							paletteColor={color}
							handleUsePaletteColor={handleUsePaletteColor}
						/>
						{/* Tools: Eraser */}
					</Grid>
					<Grid item>
						<IconButton
							aria-label="Undo"
							onClick={handleUndo}
							title="Undo"
							size='small'
						>
							<UndoIcon />
							{/* {historyUndoCount} */}
						</IconButton>
						<IconButton
							aria-label="Redo"
							onClick={handleRedo}
							title="Redo"
							size='small'
						>
							<RedoIcon />
							{/* {historyRedoCount} */}
						</IconButton>
						<ErasingAllConfirmationButton handleEraseAll={handleEraseAll} />
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingBoard;
