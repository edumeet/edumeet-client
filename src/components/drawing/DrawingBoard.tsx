import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
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
	const [canvasHeight, setCanvasHeight] = useState<number>(); // eslint-disable-line
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	
	const [ mode, setMode ] = useState<string>([ 'brush', 'text', 'eraser' ][0]);
	const [ size, ] = useState<number>(5);
	const [ colorsMenu, ] = useState<string>([ 'Row', 'Menu', 'Menu2' ][0]);
	const [ colors, ] = useState<string[]>([ 'black', 'white', 'gray', 'green', 'yellow', 'orange', 'red', 'blue', 'purple' ]);
	const [ color, setColor ] = useState<string>(colors[0]);
	const [ bgColors, ] = useState<string[]>([ 'lightgray', 'white', 'black' ]);
	const [ bgColor, ] = useState<string>(bgColors[0]);
	
	const [ historyRedo, setHistoryRedo ] = useState<fabric.Object[]>([]);
	const historyActionRef = useRef<string | null>(null);
	
	useEffect(() => {
		if (canvasRef.current) {
			const newCanvas = new fabric.Canvas(canvasRef.current, {
				backgroundColor: bgColor,
				isDrawingMode: true
			});

			const resizeCanvas = () => {
		
				const windowInnerWidth = window.innerWidth;
				const calculatedHeight = windowInnerWidth / aspectRatio;
				const scaleFactor = Math.min(windowInnerWidth / 1920, window.innerHeight / 1080);

				newCanvas.setWidth(windowInnerWidth);
				newCanvas.setHeight(calculatedHeight);
				newCanvas.setZoom(scaleFactor);
				
				setCanvasWidth(windowInnerWidth);
				setCanvasHeight(calculatedHeight);
		
				// newCanvas.setWidth(originalWidth * scaleFactor);
				// newCanvas.setHeight(originalHeight * scaleFactor);
				
				// setCanvasFactor(scaleFactor);
				// setCanvasWidth(`${originalWidth * scaleFactor}px`);
				// setCanvasHeight(`${originalHeight * scaleFactor}px`);
				newCanvas.renderAll();
			};

			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);
			
			newCanvas.on('object:added', () => {
				switch (historyActionRef.current) {
					case null:
						setHistoryRedo([]);
						historyActionRef.current = null;

						break;
					case 'redo':
						historyActionRef.current = null;
						break;
					default:
						break;
				}
			});

			newCanvas.on('object:modified', () => { });
			newCanvas.on('object:removed', () => { });

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
			canvas.off('mouse:down');

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
			canvas.off('mouse:down');

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
				setHistoryRedo((prevItems) => [ ...prevItems, history[history.length - 1] ]);
				canvas.remove(history[history.length - 1]);
				canvas.renderAll();
			}
		}
	};
	
	const handleRedo = () => {
		if (canvas) {
			
			historyActionRef.current = 'redo';

			setHistoryRedo((prevItems) => prevItems.slice(0, prevItems.length - 1));
			
			canvas.add(historyRedo[historyRedo.length - 1]);
			canvas.renderAll();

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
			<Grid container item
				xs={12}
				sx={{
					borderTop: '1px solid gray',
					backgroundColor: 'lightgray',
				}}
				justifyContent='center'
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
					justifyContent='space-between'
					xs={6}
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
							disabled={canvas ? canvas.getObjects().length === 0 : true}
						>
							<UndoIcon />
							<sub>{canvas ? canvas.getObjects().length : 0}</sub>
						</IconButton>
						<IconButton
							aria-label="Redo"
							onClick={handleRedo}
							title="Redo"
							size='small'
							disabled={historyRedo.length === 0}
						>
							<RedoIcon />
							<sub>{canvas ? historyRedo.length : 0}</sub>
						</IconButton>
						{/* {historyAction} */}
						<ErasingAllConfirmationButton handleEraseAll={handleEraseAll} />
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingBoard;
