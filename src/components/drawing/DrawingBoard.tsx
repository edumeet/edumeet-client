import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { roomActions } from '../../store/slices/roomSlice';

import { fabric } from 'fabric';
import { Box, Divider, Grid, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';

import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import ErasingAllConfirmationButton from './ErasingAllConfirmationButton';
import DrawingColorsPallete from './DrawingColorsPallete';
import { RoomState } from '../../store/slices/roomSlice';

const DrawingBoard: React.FC = () => {
	const dispatch = useAppDispatch();
	
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas>();
	const [ canvasWidth, setCanvasWidth ] = useState<number>(); // eslint-disable-line
	const [ canvasHeight, setCanvasHeight ] = useState<number>(); // eslint-disable-line
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const zoom = useAppSelector((state) => state.room.drawing.zoom);
	
	const tool = useAppSelector((state) => state.room.drawing.tool);
	
	const sizeRef = useRef<NodeJS.Timeout | null>(null);
	const pencilBrushSize = useAppSelector((state) => state.room.drawing.pencilBrushSize);
	const eraserSize = useAppSelector((state) => state.room.drawing.eraserSize);
	const textSize = useAppSelector((state) => state.room.drawing.textSize);
	const [ sizeLabel, setSizeLabel ] = useState<number>();

	const colorsMenu = useAppSelector((state) => state.room.drawing.colorsMenu);
	const colors = useAppSelector((state) => state.room.drawing.colors);
	const color = useAppSelector((state) => state.room.drawing.color);
	const bgColor = useAppSelector((state) => state.room.drawing.bgColor);
	
	const [ history, setHistory ] = useState<fabric.Object[]>([]);
	const [ historyRedo, setHistoryRedo ] = useState<fabric.Object[]>([]);
	const historyActionRef = useRef<string | null>(null);

	const theme = useTheme();     
	const curr = useMediaQuery(theme.breakpoints.between('xs', 'md'));
	
	// set colors menu type depending on the screen size
	useEffect(() => {
		if (curr) {
			dispatch(roomActions.setDrawingColorsMenu('Menu'));
		} else {
			dispatch(roomActions.setDrawingColorsMenu('Row'));
		}
	}, [ curr ]);

	useEffect(() => {
		return () => {
			if (sizeRef.current) {
				clearInterval(sizeRef.current);
				sizeRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (canvasRef.current) {
			setCanvas(new fabric.Canvas(canvasRef.current, {
				backgroundColor: bgColor,
				isDrawingMode: true
			}));

			setCanvas((prevState) => {
				if (prevState) {
					prevState.on('object:added', () => {
						switch (historyActionRef.current) {
							case null:
								setHistory(prevState.getObjects());
								setHistoryRedo([]);
								historyActionRef.current = null;
								break;
							
							case 'redo':
								setHistory(prevState.getObjects());
								historyActionRef.current = null;
								break;
						}
					});
					prevState.on('object:modified', () => { 
						setHistory(prevState.getObjects());
					});
					prevState.on('object:removed', () => { 
						setHistory(prevState.getObjects());
		
					});
				}

				return prevState;

			});

			const resizeCanvas = () => {
		
				const windowInnerWidth = window.innerWidth;
				const calculatedHeight = windowInnerWidth / aspectRatio;
				const scaleFactor = Math.min(windowInnerWidth / 1920, window.innerHeight / 1080);

				setCanvas((prevState) => {

					if (prevState) {
						prevState.setWidth(windowInnerWidth); // (originalWidth * scaleFactor);
						prevState.setHeight(calculatedHeight); // (originalHeight * scaleFactor);
						prevState.setZoom(scaleFactor);
						prevState.renderAll();
					}

					return prevState;
				});
				
				setCanvasWidth(windowInnerWidth); // (originalWidth * scaleFactor)
				setCanvasHeight(calculatedHeight); // (originalHeight * scaleFactor)
				handleSetZoom(scaleFactor);
		
			};

			resizeCanvas();
			
			window.addEventListener('resize', resizeCanvas);

			// return () => {
			// 	setCanvas((prevState) => { 

			// 		prevState.dispose();
			// 		window.removeEventListener('resize', resizeCanvas);
			// 	});
					
			// };
		}
	}, []);

	useEffect(() => {
		switch (tool) {
			case 'brush':
				handleUsePencilBrush();
				setSizeLabel(pencilBrushSize);
				break;
			case
				'text':
				handleUseTextTool();
				setSizeLabel(textSize);

				break;
			case 'eraser':
				handleUseEraserTool();
				setSizeLabel(eraserSize);
				break;
		}

	}, [ canvas, tool, color, pencilBrushSize, textSize, eraserSize, zoom ]);
	
	useEffect(() => {
		handleSetHistory(history);
	}, [ history ]);

	/* handle tools */

	const handleSetTool = (value: RoomState['drawing']['tool']) => {
		dispatch(roomActions.setDrawingTool(value));
	};

	const handleSetZoom = (value: number) => {
		dispatch(roomActions.setDrawingZoom(value));
	};

	const handleUsePencilBrush = () => {

		const border = 1;
		const len = pencilBrushSize * zoom;
		const pos = (pencilBrushSize / 2) * zoom;

		const cursor = `\
		url('data:image/svg+xml;utf8,\
		<svg\
			xmlns="http://www.w3.org/2000/svg"\
			width="${len}"\
			height="${len}"\
			fill="transparent"\
			stroke="${color}"\
			stroke-width="${border}"\
		>\
			<circle cx="${pos}" cy="${pos}" r="${(pos) - border}"/>\
		</svg>'\
		) ${pos} ${pos}, auto`;
	
		setCanvas((prevState) => {
			if (prevState) {
				prevState.freeDrawingBrush = new fabric.PencilBrush(prevState);
				prevState.freeDrawingBrush.color = color;
				prevState.freeDrawingBrush.width = pencilBrushSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';
				prevState.freeDrawingCursor = cursor;
				prevState.isDrawingMode = true;
				prevState.selection = false;
				prevState.off('mouse:down');
			}

			return prevState;
		});

		handleSetTool('brush');
	};
	
	const handleUseTextTool = () => {
		
		setCanvas((prevState) => {
			if (prevState) {
				prevState.isDrawingMode = false;
				prevState.selection = false;
				prevState.forEachObject((obj) => {
					obj.selectable = false;
				});
				prevState.on('mouse:down', (event) => {
					const pointer = prevState.getPointer(event.e);
					const text = new fabric.IText('', {
						left: pointer.x,
						top: pointer.y,
						fill: color,
						fontSize: textSize,
						fontFamily: 'Arial',
					});

					prevState.add(text);
					prevState.setActiveObject(text);
					text.enterEditing();
				
				});

				handleSetTool('text');
			}
			
			return prevState;
		});
	};

	const handleUseEraserTool = () => {

		const border = 1;
		const len = eraserSize * zoom;
		const pos = (eraserSize / 2) * zoom;
		const strokeColor = 'black';

		const cursor = `\
		url('data:image/svg+xml;utf8,\
		<svg\
			xmlns="http://www.w3.org/2000/svg"\
			width="${len}"\
			height="${len}"\
			fill="transparent"\
			stroke="${strokeColor}"\
			stroke-width="${border}"\
			stroke-dasharray="5" \
		>\
			<circle cx="${pos}" cy="${pos}" r="${(pos) - border}"/>\
		</svg>'\
		) ${pos} ${pos}, auto`;

		setCanvas((prevState) => {
			if (prevState) {
				prevState.freeDrawingBrush = new fabric.PencilBrush(prevState);
				prevState.freeDrawingBrush.color = bgColor;
				prevState.freeDrawingBrush.width = eraserSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';			
				prevState.freeDrawingCursor = cursor;
				prevState.isDrawingMode = true;
				prevState.selection = false;
				prevState.off('mouse:down');
			}
			
			return prevState;
		});

		handleSetTool('eraser');
	};

	const handleIncreaseSize = (e: React.MouseEvent<HTMLButtonElement>) => {

		switch (e.type) {
			case 'click':

				switch (tool) {
					case 'brush':
						dispatch(roomActions.setDrawingPencilBrushSizeInc());
						break;
					case 'text':
						dispatch(roomActions.setDrawingTexSizetInc());
						break;
					case 'eraser':
						dispatch(roomActions.setDrawingEraserSizeInc());
						break;
				}				
				break;
			case 'mousedown':
				if (!sizeRef.current) {
					sizeRef.current = setTimeout(() => {
						sizeRef.current = setInterval(() => {

							switch (tool) {
								case 'brush':
									dispatch(roomActions.setDrawingPencilBrushSizeInc());
									break;
								case 'text':
									dispatch(roomActions.setDrawingTexSizetInc());
									break;
								case 'eraser':
									dispatch(roomActions.setDrawingEraserSizeInc());
									break;
							}			

						}, 20);
					}, 600);
				}
				break;
			case 'mouseup':
			case 'mouseleave':
				if (sizeRef.current) {
					clearInterval(sizeRef.current);
					sizeRef.current = null;
				}
				break;
		}
	};

	const handleDecreaseSize = (e: React.MouseEvent<HTMLButtonElement>) => {

		switch (e.type) {
			case 'click':

				switch (tool) {
					case 'brush':
						dispatch(roomActions.setDrawingPencilBrushSizeDec());
						break;
					case 'text':
						dispatch(roomActions.setDrawingTextSizeDec());
						break;
					case 'eraser':
						dispatch(roomActions.setDrawingEraserSizeDec());
						break;
				}				
				
				break;
			case 'mousedown':
				if (!sizeRef.current) {
					sizeRef.current = setTimeout(() => {
						sizeRef.current = setInterval(() => {

							switch (tool) {
								case 'brush':
									dispatch(roomActions.setDrawingPencilBrushSizeDec());
									break;
								case 'text':
									dispatch(roomActions.setDrawingTextSizeDec());
									break;
								case 'eraser':
									dispatch(roomActions.setDrawingEraserSizeDec());
									break;
							}	
								
						}, 20);
					}, 600);
				}
				break;
			case 'mouseup':
			case 'mouseleave':
				if (sizeRef.current) {
					clearInterval(sizeRef.current);
					sizeRef.current = null;
				}
				break;
		}
	};

	const handleUsePaletteColor = (selectedColor: RoomState['drawing']['color']) => {
		dispatch(roomActions.setDrawingColor(selectedColor));

	};
	
	/* handle history */

	const handleSetHistory = (value: fabric.Object[]) => {
		dispatch(roomActions.setDrawingHistory(JSON.stringify(value)));
	};
	
	const handleUndo = () => {
		setCanvas((prevState) => {
			if (prevState) {
				setHistoryRedo((prevItems) => [ ...prevItems, history[history.length - 1] ]);
				prevState.remove(history[history.length - 1]);
				prevState.renderAll();
			}
			
			return prevState;
		});
	};
	
	const handleRedo = () => {
		setCanvas((prevState) => {
			if (prevState) {
			
				historyActionRef.current = 'redo';

				setHistoryRedo((prevItems) => prevItems.slice(0, prevItems.length - 1));
			
				prevState.add(historyRedo[historyRedo.length - 1]);
				prevState.renderAll();

			}
			
			return prevState;
		});
	};
	
	const handleEraseAll = () => {
		setCanvas((prevState) => {
			if (prevState) {
				prevState.clear();
				prevState.backgroundColor = bgColor;

				if (prevState.getObjects().length === 0)
					setHistoryRedo([]);
			}
			
			return prevState;
		});
	};

	return (
		<Grid container>

			{/* Canvas */}
			<Grid item>
				<Box ref={canvasRef} component="canvas" />
			</Grid>

			{/* Menu */}
			<Grid container item
				// xs={12}
				sx={{
					borderTop: '1px solid gray',
					backgroundColor: 'lightgray',
				}}
				justifyContent='center'
				direction='row'
				wrap='nowrap'

			>
				{/* Toolbar */}
				<Grid
					item
					container	
					margin={1}
					border={1}
					borderColor={'gray'}
					borderRadius={6}
					padding={0.6}
					wrap='nowrap'
					gap={0.5}
					xs='auto'
				>
					
					{/* Draw */} <Divider orientation="vertical" sx={{ display: 'none' }} />

					<Grid
						item
						container
						xs='auto'
						wrap='nowrap'
					>
						<IconButton
							aria-label="Use Pencil Brush Tool"
							onClick={handleUsePencilBrush}
							title="Use Pencil Brush Tool"
							style={{ border: tool === 'brush' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<DrawIcon
								style={{ color: tool === 'brush' ? color : 'inherit' }}
							/>
						</IconButton>
						<IconButton
							aria-label="Use Text Tool"
							onClick={handleUseTextTool}
							title="Use Text Tool"
							style={{ border: tool === 'text' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<AbcIcon
								style={{ color: tool === 'text' ? color : 'inherit' }}
							/>
						</IconButton>
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
						item
						container
						xs='auto'
					>
						<IconButton
							aria-label="Increase Size"
							onClick={handleIncreaseSize}
							onMouseDown={handleIncreaseSize}
							onMouseUp={handleIncreaseSize}
							onMouseLeave={handleIncreaseSize}
							title="Increase Size"
							size='small'
						>
							<AddCircleOutlineIcon />
						</IconButton>

						<Typography 
							variant="caption" 
							width={20}
							display="flex" 
							alignItems="center" 
							justifyContent="center"
						>
							{sizeLabel}
						</Typography>
						
						<IconButton
							aria-label="Decrease Size"
							onClick={handleDecreaseSize}
							onMouseDown={handleDecreaseSize}
							onMouseUp={handleIncreaseSize}
							onMouseLeave={handleIncreaseSize}
							title="Decrease Size"
							size='small'
						>
							<RemoveCircleOutlineIcon />
						</IconButton>
					</Grid>

					{/* Color */} <Divider orientation="vertical" />

					<Grid
						item
						container
						xs='auto'
					>							
						<DrawingColorsPallete
							type={colorsMenu}
							paletteColors={colors}
							paletteColor={color}
							handleUsePaletteColor={handleUsePaletteColor}
						/>
					</Grid>

					{/* History */} <Divider orientation="vertical" />

					<Grid
						item
						container
						xs='auto'
						justifyContent={'flex-end'}
						wrap='nowrap'

					>
						<IconButton
							aria-label="Undo"
							onClick={handleUndo}
							title="Undo"
							size='small'
							disabled={history.length === 0}
						>
							<UndoIcon />
							{/* <sub>{history.length}</sub> */}
						</IconButton>
						<IconButton
							aria-label="Redo"
							onClick={handleRedo}
							title="Redo"
							size='small'
							disabled={historyRedo.length === 0}
						>
							<RedoIcon />
							{/* <sub>{historyRedo.length}</sub> */}
						</IconButton>
						{/* {historyAction} */}
						<ErasingAllConfirmationButton
							handleEraseAll={handleEraseAll}
							disabled={history.length === 0}
						/>
						
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingBoard;
