import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { roomActions } from '../../store/slices/roomSlice';

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
	const dispatch = useAppDispatch();
	
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<fabric.Canvas>();
	const [ canvasWidth, setCanvasWidth ] = useState<number>(); // eslint-disable-line
	const [ canvasHeight, setCanvasHeight ] = useState<number>(); // eslint-disable-line
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	
	const mode = useAppSelector((state) => state.room.drawing.mode);
	const size = useAppSelector((state) => state.room.drawing.size);
	const zoom = useAppSelector((state) => state.room.drawing.zoom);
	const colorsMenu = useAppSelector((state) => state.room.drawing.colorsMenu);
	const colors = useAppSelector((state) => state.room.drawing.colors);
	const color = useAppSelector((state) => state.room.drawing.color);
	const bgColor = useAppSelector((state) => state.room.drawing.bgColor);
	
	const [ history, setHistory ] = useState<fabric.Object[]>([]);
	const [ historyRedo, setHistoryRedo ] = useState<fabric.Object[]>([]);
	const historyActionRef = useRef<string | null>(null);
	
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
		switch (mode) {
			case 'brush': handleUsePencil(); break;
			case 'text': handleUseTextTool(); break;
		}

	}, [ canvas, color, size, zoom ]);
	
	useEffect(() => {
		handleSetHistory(history);
	}, [ history ]);
	
	const handleSetHistory = (value: fabric.Object[]) => {
		if (canvas) {
			dispatch(roomActions.setDrawingHistory(JSON.stringify(value)));
		}
	};

	const handleUsePaletteColor = (selectedColor: string) => {
		handleSetColor(selectedColor);
	};

	const handleSetMode = (value: string) => {
		if (canvas) {
			dispatch(roomActions.setDrawingMode(value));
		}
	};

	const handleSetColor = (value: string) => {
		if (canvas) {
			dispatch(roomActions.setDrawingColor(value));
		}
	};

	const handleSetZoom = (value: number) => {
		dispatch(roomActions.setDrawingZoom(value));
	};

	const handleUsePencil = () => {

		const border = 1;
		const len = size * zoom;
		const pos = (size / 2) * zoom;

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
				prevState.freeDrawingBrush.width = size;
				prevState.freeDrawingBrush.strokeLineCap = 'round';
				prevState.freeDrawingCursor = cursor;
				prevState.isDrawingMode = true;
				prevState.selection = false;
				prevState.off('mouse:down');
			}

			return prevState;
		});

		handleSetMode('brush');
	};

	const handleUseEraserTool = () => {

		const svgBorder = 1;

		const cursor = `\
		url('data:image/svg+xml;utf8, \
		<svg \
			xmlns="http://www.w3.org/2000/svg" \
			width="${size * 2}" \
			height="${size * 2}" \
			fill="transparent" \
			stroke="${color}" \
			stroke-width="${svgBorder}"> \
			<circle cx="${size}" cy="${size}" r="${size - svgBorder}"/> \
		</svg>'\
		) ${size} ${size}, auto`;

		setCanvas((prevState) => {
			if (prevState) {
				prevState.freeDrawingBrush = new fabric.PencilBrush(prevState);
				prevState.freeDrawingBrush.color = bgColor;
				prevState.freeDrawingBrush.width = size;
				prevState.freeDrawingBrush.strokeLineCap = 'round';			
				prevState.freeDrawingCursor = cursor;
				prevState.isDrawingMode = true;
				prevState.selection = false;
				prevState.off('mouse:down');
			}
			
			return prevState;
		});

		handleSetMode('eraser');
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
						fontSize: 100,
						fontFamily: 'Arial',
					});

					prevState.add(text);
					prevState.setActiveObject(text);
					text.enterEditing();
				
				});

				handleSetMode('text');
			}
			
			return prevState;
		});
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
					</Grid>
					<Grid item>
						<IconButton
							aria-label="Undo"
							onClick={handleUndo}
							title="Undo"
							size='small'
							disabled={history.length === 0}
						>
							<UndoIcon />
							<sub>{history.length}</sub>
						</IconButton>
						<IconButton
							aria-label="Redo"
							onClick={handleRedo}
							title="Redo"
							size='small'
							disabled={historyRedo.length === 0}
						>
							<RedoIcon />
							<sub>{historyRedo.length}</sub>
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
