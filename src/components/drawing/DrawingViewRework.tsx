/* eslint-disable no-console */
import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { drawingActions, DrawingState } from '../../store/slices/drawingSlice2';
import { setDrawingBgColor } from '../../store/actions/drawingActions';

import { Canvas, FabricObject, PencilBrush, Textbox, util } from 'fabric';
import { EraserBrush, isTransparent } from '@erase2d/fabric';
import { Box, Divider, Grid2 as Grid, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';

import PanToolIcon from '@mui/icons-material/PanTool';
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
import { FabricAction } from '../../store/slices/drawingSlice';

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
	const [ canvas, setCanvas ] = useState<Canvas>();
	const zoom = useAppSelector((state) => state.drawing.zoom);
	
	// tools
	const menuRef = useRef<HTMLDivElement>(null);
	const tool = useAppSelector((state) => state.drawing.tool);
	
	// size
	const sizeRef = useRef<NodeJS.Timeout | null>(null);
	
	const pencilBrushSize = useAppSelector((state) => state.drawing.pencilBrushSize);
	const pencilBrushSizeRange = useAppSelector((state) => state.drawing.pencilBrushSizeRange);
	const eraserSize = useAppSelector((state) => state.drawing.eraserSize);
	const eraserSizeRange = useAppSelector((state) => state.drawing.eraserSizeRange);
	const textSize = useAppSelector((state) => state.drawing.textSize);
	const textSizeRange = useAppSelector((state) => state.drawing.textSizeRange);
	
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
	const actionRef = useRef< 'text' | 'undo' | 'redo' | 'select' | 'clear' | null>(null);
	const pastActions = useAppSelector((state) => state.drawing.history.past);
	const futureActions = useAppSelector((state) => state.drawing.history.future);

	/* create canvas object */
	useEffect(() => {

		if (canvasRef.current) {
			// Create a new canvas
			setCanvas(new Canvas(canvasRef.current, {
				backgroundColor: bgColor,
				isDrawingMode: true
			}));
			
			setCanvas((prevState) => {
				if (prevState) {
					
					const handleObjectEvent = (status: 'added' | 'modified' | 'removed') => (obj: {target: FabricObject}) => {			
						if (actionRef.current === null) {
					
							const object = obj.target as FabricObject;

							object.erasable = Object.hasOwn(object, 'text') ? false : true;
							object.id = object.id ?? Date.now();
										
							console.log(status);
							console.log(JSON.stringify(object));

							dispatch(drawingActions.recordAction({ object: object.toObject(), status }));
						}
					};
					
					prevState.on('object:added', handleObjectEvent('added'));
					prevState.on('object:modified', handleObjectEvent('modified'));
					prevState.on('object:removed', handleObjectEvent('removed'));
				}
            
				return prevState;
            
			});
		}

		return () => {
			// Clear history before disposing the canvas
			dispatch(drawingActions.clear());
						
			setCanvas((prevState) => {
				prevState?.dispose();
				
				return undefined;
			});
		};
	}, []);

	/* set canvas size */
	useEffect(() => {
		const currWidth = width;
		const currHeight = height - (menuRef.current?.clientHeight ?? 0);
		const currScaleFactor = Math.min(currWidth / 1920, currHeight / 1080);

		setCanvas((prevState) => {

			if (prevState) {
				prevState.setDimensions({ width: currWidth, height: currHeight });
				prevState.setZoom(currScaleFactor);
				prevState.renderAll();
			}

			return prevState;
		});
			
		handleSetZoom(currScaleFactor);
		
	}, [ width, height ]);

	/* tools */
	useEffect(() => {
		switch (tool) {
			case 'move':
				handleUseMoveTool();
				break;
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
				
				return prevState;
			});
		}
	}, [ bgColor ]);

	/* handling functions */
	const handleSetZoom = (value: number) => {
		dispatch(drawingActions.setDrawingZoom(value));
	};
    
	const handleSetTool = (value: DrawingState['tool']) => {
		dispatch(drawingActions.setDrawingTool(value));
	};

	const handleUseMoveTool = () => {

		setCanvas((prevState) => {
			if (prevState) {
				prevState.isDrawingMode = false;
				prevState.defaultCursor = 'default';
				prevState.hoverCursor = 'default';
				prevState.selection = false;

				/* For group select if prevState.selection = true */
				// prevState.selectionColor ='transparent';
				// prevState.selectionBorderColor = 'lightblue';
				// prevState.selectionDashArray=[ 4, 4 ];

				handleSetTool('move');
			}
			
			return prevState;
		});
	};

	const drawingCursor = (len: number, pos: number, border: number) => {		
		const cursor = `
		<svg
			height="${ len }"
			width="${ len }"
			stroke="${color}"
			stroke-width="${border}"
			fill="${ color }"
			viewBox="0 0 ${ len } ${ len }"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="${pos}"
				cy="${pos}"
				r="${ (pos) - border }" 
			/>
		</svg>
	`;
	
		return `data:image/svg+xml;base64,${ window.btoa(cursor) }`;

	};

	const handleUsePencilBrush = () => {

		const border = 1;
		const len = pencilBrushSize * zoom;
		const pos = (pencilBrushSize / 2) * zoom;
	
		setCanvas((prevState) => {
			if (prevState) {
				prevState.freeDrawingBrush = new PencilBrush(prevState);
				prevState.freeDrawingBrush.color = color;
				prevState.freeDrawingBrush.width = pencilBrushSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';
				prevState.freeDrawingCursor = `url(${drawingCursor(len, pos, border)}) ${ len / 2 } ${ len / 2 }, default`;
				prevState.isDrawingMode = true;
				prevState.selection = false;
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
				const dispose = prevState.on('mouse:down', (event) => {
					actionRef.current = 'text';

					const pointer = prevState.getScenePoint(event.e);
					const text = new Textbox('', {
						left: pointer.x,
						top: pointer.y,
						fill: color,
						fontSize: textSize,
						fontFamily: 'Arial',
					});

					prevState.add(text);
					prevState.setActiveObject(text);
					text.enterEditing();
					
					text.on('editing:exited', () => {
						actionRef.current = null;
					});
					
					dispose();
				});
				
				handleSetTool('text');

			}
			
			return prevState;
		});
	};

	const eraserCursor = (len: number, strokeColor: string, pos: number, border: number) => {		
		const cursor = `
		<svg
			height="${ len }"
			width="${ len }"
			stroke="${ strokeColor }"
			stroke-width="${border}"
			stroke-dasharray="5"
			fill="transparent"
			viewBox="0 0 ${ len } ${ len }"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="${pos}"
				cy="${pos}"
				r="${ (pos) - border }" 
			/>
		</svg>
	`;
	
		return `data:image/svg+xml;base64,${ window.btoa(cursor) }`;

	};

	const handleUseEraserTool = () => {

		// Erasor tool from: https://github.com/ShaMan123/erase2d

		const border = 1;
		const len = eraserSize * zoom;
		const pos = (eraserSize / 2) * zoom;
		const strokeColor = 'black';

		setCanvas((prevState) => {
			if (prevState) {
				const eraser = new EraserBrush(prevState);

				prevState.freeDrawingBrush = eraser;
				prevState.freeDrawingBrush.width = eraserSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';			
				prevState.freeDrawingCursor = `url(${eraserCursor(len, strokeColor, pos, border)}) ${ len / 2 } ${ len / 2 }, default`;

				eraser.on('end', async (e) => {
					e.preventDefault();
					const { targets } = e.detail;

					await eraser.commit(e.detail);

					// array of all objects on the canvas where erase have been used on
					const masking = await Promise.all(
						targets.map(
							async (target) => [ target, await isTransparent(target) ] as const
						)
					);

					// Erase fully masked objects
					const fullyErased = masking
						.filter(([ , masked ]) => masked)
						.map(([ object ]) => object);

					fullyErased.forEach((object) => (object.parent || prevState).remove(object));

					// fire event when erase has ended to add to history
					if (fullyErased.length == 0) {
						targets.forEach((target) => {
							console.log(JSON.stringify(target));
							prevState.fire('object:modified', { target: target });
						});
					}

					prevState.requestRenderAll();
				});
				
				prevState.isDrawingMode = true;
				prevState.selection = false;
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
	const handleUndo = () => {
		setCanvas((prevState) => {
			if (prevState) {
        
				actionRef.current = 'undo';

				const lastAction = pastActions.at(-1);
        
				if (lastAction !== undefined) {
					
					// Creates a fabric instance of an object
					const undoing = util.enlivenObjects([ lastAction.object ]).then((objects) => {

						const lA = objects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
						const enlivenObject : FabricObject = lA[0];
        
						// remove added object
						if (lastAction.status === 'added') {    
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							foundObject && prevState.remove(foundObject);
							
						// revert changes to object
						} else if (lastAction.status === 'modified') {

							// Filter all actions with the same object id and get the object's previous state which is the second newest object
							const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
							const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;
							
							if (prevAction !== undefined) {
								util.enlivenObjects([ prevAction.object ]).then((prevObjects) => {
									const pA = prevObjects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
									const _enlivenObject : FabricObject & { id?: number } = pA[0];
									const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === _enlivenObject.id);

									// In case the object is a textbox we need to typecast as getObjects() returns a FabricObject. 
									// At the time of writing this there is no Canvas method to get Textbox objects from the canvas.
									if (foundObject && Object.hasOwn(foundObject, 'text') && Object.hasOwn(_enlivenObject, 'text')) {
										const fo = foundObject as Textbox;
										const eo = _enlivenObject as Textbox;

										fo.set({ text: eo.text });
									}
									
									foundObject?.set({ angle: _enlivenObject.angle, width: _enlivenObject.width, height: _enlivenObject.height, scaleX: _enlivenObject.scaleX, scaleY: _enlivenObject.scaleY });
									foundObject?.setXY(_enlivenObject.getXY());

									// Call to update state on canvas
									foundObject?.setCoords();
									prevState.renderAll();
								});
							} else if (prevAction == undefined && Object.hasOwn(enlivenObject, 'text')) {
								const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

								foundObject && prevState.remove(foundObject);
							}

						// add removed object
						} else if (lastAction.status === 'removed') {
							// Set erasable to true, is undefined as the property is from erase2d and not fabricjs
							enlivenObject.erasable = true;

							prevState.add(enlivenObject);
						}
        
						dispatch(drawingActions.undo());
						
					});
        
					undoing.finally(() => {
						actionRef.current = null;
					});
				}
			}
                    
			return prevState;
		});
	};
	
	const handleRedo = () => {
		setCanvas((prevState) => {
			if (prevState) {
        
				actionRef.current = 'redo';
        
				const nextAction = futureActions.at(-1);
        
				if (nextAction !== undefined) {
					
					const redoing = util.enlivenObjects([ nextAction.object ]).then((objects) => {

						const nA = objects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
						const enlivenObject : FabricObject = nA[0];
        
						// remove added object
						if (nextAction.status === 'added') {    
							// Set erasable to true, is undefined as the property is from erase2d and not fabricjs
							enlivenObject.erasable = true;

							prevState.add(enlivenObject);
							
							// revert changes to object
						} else if (nextAction.status === 'modified') {

							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							// As newly created textboxes do not have the status added we will need to add it here
							if (foundObject == undefined && Object.hasOwn(enlivenObject, 'text')) {
								prevState.add(enlivenObject);
							}

							// In case the object is a textbox we need to typecast as getObjects() returns a FabricObject. 
							// At the time of writing this there is no Canvas method to get Textbox objects from the canvas.
							if (foundObject && Object.hasOwn(foundObject, 'text') && Object.hasOwn(enlivenObject, 'text')) {
								const fo = foundObject as Textbox;
								const eo = enlivenObject as Textbox;

								fo.set({ text: eo.text });
							}

							foundObject?.set({ angle: enlivenObject.angle, width: enlivenObject.width, height: enlivenObject.height, scaleX: enlivenObject.scaleX, scaleY: enlivenObject.scaleY });
							foundObject?.setXY(enlivenObject.getXY());
									
							// Call to update state on canvas
							foundObject?.setCoords();
							prevState.renderAll();
							
							// add removed object
						} else if (nextAction.status === 'removed') {
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							foundObject && prevState.remove(foundObject);
						}
        
						dispatch(drawingActions.redo());
        
					});
					
					redoing.finally(() => {
						actionRef.current = null;
					});
				}
			}
                    
			return prevState;
		});
	};

	const handleEraseAll = () => {
		setCanvas((prevState) => {

			actionRef.current = 'clear';
			
			if (prevState) {
				prevState.clear();
				prevState.backgroundColor = bgColor;

				dispatch(drawingActions.clear());

				actionRef.current = null;
			}
			
			return prevState;
		});
	};

	return (
		<Grid
			container
		>
			{/* Canvas */}
			<Grid>
				<Box ref={canvasRef} component="canvas" />
			</Grid>

			{/* Menu */}
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
		</Grid>
	);
};

export default DrawingView;
