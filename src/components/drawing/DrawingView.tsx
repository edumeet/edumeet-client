import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { drawingActions } from '../../store/slices/drawingSlice';
import { setDrawingBgColor } from '../../store/actions/drawingActions';
import { DrawingState } from '../../store/slices/drawingSlice';

import { fabric } from 'fabric';
import { Box, Divider, Grid, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';

import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import AbcIcon from '@mui/icons-material/Abc';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import ErasingAllConfirmationButton from './menu/ErasingAllConfirmationButton';
import ColorsPicker from './menu/ColorsPicker';
import BgColorsPicker from './menu/BgColorsPicker';

interface DrawingViewProps {
	width: number;
	height: number;
}

const DrawingView = ({ width, height }: DrawingViewProps): JSX.Element => {
	const dispatch = useAppDispatch();
    
	// theme
	const theme = useTheme();     
	
	// canvas
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas>();
	const [ canvasWidth, setCanvasWidth ] = useState<number>(); // eslint-disable-line
	const [ canvasHeight, setCanvasHeight ] = useState<number>(); // eslint-disable-line
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio); // eslint-disable-line
	const zoom = useAppSelector((state) => state.drawing.zoom);
	
	// tools
	const menuRef = useRef<HTMLDivElement>(null);
	const tool = useAppSelector((state) => state.drawing.tool);
	
	// size
	const sizeRef = useRef<NodeJS.Timeout | null>(null);
	
	const pencilBrushSize = useAppSelector((state) => state.drawing.pencilBrushSize);
	const pencilBrushSizeRange = useAppSelector((state) => state.drawing.pencilBrushSizeRange); // eslint-disable-line
	const eraserSize = useAppSelector((state) => state.drawing.eraserSize);
	const eraserSizeRange = useAppSelector((state) => state.drawing.eraserSizeRange); // eslint-disable-line
	const textSize = useAppSelector((state) => state.drawing.textSize);
	const textSizeRange = useAppSelector((state) => state.drawing.textSizeRange);// eslint-disable-line
	
	const [ size, setSize ] = useState<number>();
	const [ sizeRange, setSizeRange ] = useState<{ min: number, max: number }>();

	// colors
	const isColorsPickerPopover = useMediaQuery(theme.breakpoints.between('xs', 'md'));
	const colorsPicker = useAppSelector((state) => state.drawing.colorsPicker);
	const colors = useAppSelector((state) => state.drawing.colors);
	const color = useAppSelector((state) => state.drawing.color);
	const bgColors = useAppSelector((state) => state.drawing.bgColors);
	const bgColor = useAppSelector((state) => state.drawing.bgColor);
	
	// history
	const [ history, setHistory ] = useState<fabric.Object[]>([]);
	const [ historyRedo, setHistoryRedo ] = useState<fabric.Object[]>([]);
	const historyActionRef = useRef<string | null>(null);

	/* create canvas object */
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
		}
	}, []);

	/* set canvas size */
	useEffect(() => {
		const resizeCanvas = () => {
		
			const currWidth = width;
			const currHeight = height - (menuRef.current?.clientHeight ?? 0);

			// const currHeight = (height / aspectRatio);

			const currScaleFactor = Math.min(currWidth / 1920, currHeight / 1080);

			setCanvas((prevState) => {

				if (prevState) {
					prevState.setWidth(currWidth); 
					prevState.setHeight(currHeight);
					prevState.setZoom(currScaleFactor);
					prevState.renderAll();
				}

				return prevState;
			});
				
			setCanvasWidth(currWidth); 
			setCanvasHeight(currHeight);
			handleSetZoom(currScaleFactor);
		
		};

		resizeCanvas();
			
		window.addEventListener('resize', resizeCanvas);
            
		return () => {
			
			window.removeEventListener('resize', resizeCanvas);
			
			canvas?.dispose();

		};
		
	}, [ width, height ]);

	/* tools */
	useEffect(() => {
		switch (tool) {
			case 'pencilBrush':
				handleUsePencilBrush();
				setSize(pencilBrushSize);
				setSizeRange(pencilBrushSizeRange);
				break;
			case
				'text':
				handleUseTextTool();
				setSize(textSize);
				setSizeRange(textSizeRange);

				break;
			case 'eraser':
				handleUseEraserTool();
				setSize(eraserSize);
				setSizeRange(eraserSizeRange);
				break;
			
		}
		
	}, [ canvas, tool, color, pencilBrushSize, textSize, eraserSize, zoom ]);
	
	/* size  */
	useEffect(() => {
		return () => {
			if (sizeRef.current) {
				clearInterval(sizeRef.current);
				sizeRef.current = null;
			}
		};
	}, []);
    
	/* colors  */
	useEffect(() => {
		if (isColorsPickerPopover) {
			dispatch(drawingActions.setDrawingColorsPicker('Popover'));
		} else {
			dispatch(drawingActions.setDrawingColorsPicker('Row'));
		}
	}, [ isColorsPickerPopover ]);
	
	useEffect(() => {		
		handleUseBgColor(bgColor);

		if (tool === 'eraser') {
			setCanvas((prevState) => {
				if (prevState) {
					prevState.freeDrawingBrush.color = bgColor;
					prevState.renderAll();
				}
				
				return prevState;
			});
		}
	}, [ bgColor ]);

	/* history */
	useEffect(() => {
		handleSetHistory(history);
	}, [ history ]);

	/* handling functions */
	const handleSetZoom = (value: number) => {
		dispatch(drawingActions.setDrawingZoom(value));
	};
    
	const handleSetTool = (value: DrawingState['tool']) => {
		dispatch(drawingActions.setDrawingTool(value));
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

		handleSetTool('pencilBrush');
	};
	
	const handleUseTextTool = () => {

		setCanvas((prevState) => {
			if (prevState) {
				prevState.isDrawingMode = false;
				prevState.selection = false;
				prevState.defaultCursor = 'text';
				prevState.hoverCursor = 'text';
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

	const handleChangeSize = (e: React.MouseEvent<HTMLButtonElement>, operation: 'inc'|'dec') => {
        
		switch (tool) {
            
			case 'pencilBrush':
				switch (e.type) {
					case 'click': dispatch(drawingActions.setDrawingPencilBrushSize({ operation })); break;
					case 'mousedown':
                        
						if (!sizeRef.current) {
							sizeRef.current = setTimeout(() => {
								sizeRef.current = setInterval(() => {
									
									dispatch(drawingActions.setDrawingPencilBrushSize({ operation }));
        
								}, 20);
							}, 600);
						}
                        
						break;
				}

				break;
            
			case 'text':
				switch (e.type) {
					case 'click': dispatch(drawingActions.setDrawingTextSize({ operation })); break;
					case 'mousedown':
						if (!sizeRef.current) {
							sizeRef.current = setTimeout(() => {
								sizeRef.current = setInterval(() => {
                                
									dispatch(drawingActions.setDrawingTextSize({ operation }));
    
								}, 20);
							}, 600);
						}
						
						break;
				}
				
				break;
            
			case 'eraser':
				switch (e.type) {
					case 'click': dispatch(drawingActions.setDrawingEraserSize({ operation })); break;
					case 'mousedown':
						if (!sizeRef.current) {
							sizeRef.current = setTimeout(() => {
								sizeRef.current = setInterval(() => {
                                    
									dispatch(drawingActions.setDrawingEraserSize({ operation }));
                                    
								}, 20);
							}, 600);
						}
						break;
					case 'mouseup':
				}
				
				break;
		}

		if (e.type === 'mouseleave' || e.type === 'mouseup') {
			if (sizeRef.current) {
				clearInterval(sizeRef.current);
				sizeRef.current = null;
			}
		}				
	};

	const handleUseColor = (selectedColor: DrawingState['color']) => {
		dispatch(drawingActions.setDrawingColor(selectedColor));

	};

	const handleUseBgColor = (selectedColor: DrawingState['bgColor']) => {
		dispatch(setDrawingBgColor(selectedColor));

		setCanvas((prevState) => {
			if (prevState) {
				prevState.backgroundColor = bgColor;
				prevState.renderAll();
			}
			
			return prevState;
		});

	};
	
	/* handle history */

	const handleSetHistory = (value: fabric.Object[]) => {
		dispatch(drawingActions.setDrawingHistory(JSON.stringify(value)));
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
		<Grid
			container
		>
			{/* Canvas */}
			<Grid item>
				<Box ref={canvasRef} component="canvas" />
			</Grid>

			{/* Menu */}
			<Grid container item
				sx={{
					borderTop: '1px solid gray',
					backgroundColor: 'lightgray',
				}}
				ref={menuRef}
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
						{/* PencilBrush */}
						<IconButton
							aria-label="Use Pencil Brush Tool"
							onClick={handleUsePencilBrush}
							title="Use Pencil Brush Tool"
							style={{ border: tool === 'pencilBrush' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<DrawIcon
								// style={{ color: color }}
							/>
						</IconButton>

						{/* Text */}
						<IconButton
							aria-label="Use Text Tool"
							onClick={handleUseTextTool}
							title="Use Text Tool"
							style={{ border: tool === 'text' ? '2px solid gray' : '2px solid lightgray' }}
							size='small'
						>
							<AbcIcon
								// style={{ color: color }}
							/>
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
						item
						container
						xs='auto'
					>
						{/* Increase Size */}
						<IconButton
							aria-label="Increase Size"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'inc')}
							onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'inc')}
							onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'inc')}
							onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'inc')}
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
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'dec')}
							onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'dec')}
							onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'dec')}
							onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => handleChangeSize(e, 'dec')}
							disabled={sizeRange && size === sizeRange.min}
							title="Decrease Size"
							size='small'
						>
							<RemoveCircleOutlineIcon />
						</IconButton>
					</Grid>

					{/* Colors */} <Divider orientation="vertical" />

					<Grid
						item
						container
						xs='auto'
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
						item
						container
						xs='auto'
					>							
						<BgColorsPicker
							bgColors={bgColors}
							bgColor={bgColor}
							handleUseBgColor={handleUseBgColor}
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
						{/* Undo */}
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

						{/* Redo */}
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
						
						{/* Erase All */}
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

export default DrawingView;
