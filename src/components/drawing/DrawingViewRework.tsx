/* eslint-disable no-console */
import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { drawingActions, DrawingState } from '../../store/slices/drawingSlice2';
import { setDrawingBgColor } from '../../store/actions/drawingActions';

import { Canvas, FabricObject, ImageFormat, IText, PencilBrush, util } from 'fabric';
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
import DownloadCanvasButton from './menu/DownloadCanvasButton';

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
	const textLimiter = useRef<boolean>(true);
	
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

	// Seems the fabricjs event handling is forcing textSize to be 30. This is the only work around I could find.
	const textFontSizeRef = useRef<number>(textSize);

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
							
							// console.log(status, object);

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
				handleUseEditTool();
				break;
			case 'pencilBrush':
				setSize(pencilBrushSize);
				setSizeRange(pencilBrushSizeRange);
				handleUsePencilBrush();
				break;
			case
				'text':
				setSize(textSize);
				setSizeRange(textSizeRange);
				handleUseTextTool();
				break;
			case 'eraser':
				setSize(eraserSize);
				setSizeRange(eraserSizeRange);
				handleUseEraserTool();
				break;
		}
		
	}, [ tool, canvas, color, pencilBrushSize, textSize, eraserSize, zoom ]);

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
	}, [ bgColor ]);

	/* handling functions */
	const handleSetZoom = (value: number) => {
		dispatch(drawingActions.setDrawingZoom(value));
	};
    
	const handleSetTool = (value: DrawingState['tool']) => {
		dispatch(drawingActions.setDrawingTool(value));
	};

	const handleUseEditTool = () => {
		
		setCanvas((prevState) => {
			if (prevState) {
				actionRef.current = null;

				prevState.isDrawingMode = false;
				prevState.defaultCursor = 'default';
				prevState.hoverCursor = 'grab';
				prevState.selection = false;
				prevState.forEachObject((obj) => {
					obj.selectable = true;
				});

				const dispose = prevState.on('mouse:down', () => {
					dispose();
				});

				// For group select if prevState.selection = true
				// prevState.selectionColor ='transparent';
				// prevState.selectionBorderColor = 'lightblue';
				// prevState.selectionDashArray=[ 4, 4 ];

				// Delete object on backspace during edit
				
				document.addEventListener('keydown', (e) => {
					const key = e.key;
					const active = prevState.getActiveObject();
					
					if (active) {
						if (Object.hasOwn(active, 'text')) {
							const _active = active as IText;

							if (_active.isEditing) {
								return;
							}
						}

						if (key === 'Backspace') {
							prevState.remove(active);
						}
					}
				});
				
				handleSetTool('edit');
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
				actionRef.current = null;

				prevState.freeDrawingBrush = new PencilBrush(prevState);
				prevState.freeDrawingBrush.color = color;
				prevState.freeDrawingBrush.width = pencilBrushSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';
				prevState.freeDrawingCursor = `url(${drawingCursor(len, pos, border)}) ${ len / 2 } ${ len / 2 }, default`;
				prevState.isDrawingMode = true;
				prevState.selection = false;

				const dispose = prevState.on('mouse:down', () => {
					dispose();
				});
			}

			return prevState;
		});

		handleSetTool('pencilBrush');
	};
	
	const handleUseTextTool = () => {

		setCanvas((prevState) => {
			if (prevState) {
				actionRef.current = 'text';
				
				prevState.isDrawingMode = false;
				prevState.selection = false;
				prevState.defaultCursor = 'text';
				prevState.hoverCursor = 'text';
				prevState.forEachObject((obj) => {
					obj.selectable = false;
				});
				textFontSizeRef.current = textSize;

				if (textLimiter.current === true) {
					
					textLimiter.current = false;
					
					prevState.on('mouse:down', (e) => {	

						if (actionRef.current === 'text') {
							actionRef.current = null;

							const pointer = e.scenePoint;
							const text = new IText('Edit text', {
								left: pointer.x,
								top: pointer.y,
								fill: color,
								fontSize: textFontSizeRef.current,
								fontFamily: 'Arial',
							});
							
							prevState.add(text);
							prevState.setActiveObject(text);
							
							text.enterEditing();
							text.selectAll();	
							
							text.on('editing:exited', () => {
								textLimiter.current = true;
							});
						}
					});
				}
				
			}
			
			return prevState;
		});

		handleSetTool('text');
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
		// Eraser tool from: https://github.com/ShaMan123/erase2d

		const border = 1;
		const len = eraserSize * zoom;
		const pos = (eraserSize / 2) * zoom;
		const strokeColor = 'black';

		setCanvas((prevState) => {
			if (prevState) {
				actionRef.current = null;

				const eraser = new EraserBrush(prevState);

				prevState.freeDrawingBrush = eraser;
				prevState.freeDrawingBrush.width = eraserSize;
				prevState.freeDrawingBrush.strokeLineCap = 'round';			
				prevState.freeDrawingCursor = `url(${eraserCursor(len, strokeColor, pos, border)}) ${ len / 2 } ${ len / 2 }, default`;

				const dispose = prevState.on('mouse:down', () => {
					dispose();
				});

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

					// Find all fully masked objects for erase 
					const fullyErased = masking
						.filter(([ , masked ]) => masked)
						.map(([ object ]) => object);

					fullyErased.forEach((object) => (object.parent || prevState).remove(object));

					const modified = targets.filter((target) => !fullyErased.includes(target));

					// fire event when erase has ended to add to history 
					if (fullyErased.length < masking.length) {
						modified.forEach((object) => {
							prevState.fire('object:modified', { target: object });
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

									if (!foundObject) {
										return;
									}

									// In case the object is a textbox we need to typecast as getObjects() returns a FabricObject. 
									// At the time of writing this there is no Canvas method to get Textbox objects from the canvas.
									if (Object.hasOwn(foundObject, 'text') && Object.hasOwn(_enlivenObject, 'text')) {
										const foundTextbox = foundObject as IText;
										const enlivenTextbox = _enlivenObject as IText;

										foundTextbox.set({ text: enlivenTextbox.text });
									}

									// erase changes the clipPath - therefore we must set the clippath to the previous
									foundObject.clipPath = _enlivenObject.clipPath;

									foundObject.set({ angle: _enlivenObject.angle, width: _enlivenObject.width, height: _enlivenObject.height, scaleX: _enlivenObject.scaleX, scaleY: _enlivenObject.scaleY, dirty: true });
									foundObject.setXY(_enlivenObject.getXY());

									// Call to update state on canvas
									foundObject.setCoords();
									prevState.renderAll();
								});
							}

						// add removed object
						} else if (lastAction.status === 'removed') {

							// Need the previous object and state for cases when objects was erased using eraser tool
							const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
							const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;

							if (prevAction !== undefined) {
								util.enlivenObjects([ prevAction.object ]).then((prevObjects) => {
									const pA = prevObjects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
									const _enlivenObject : FabricObject & { id?: number } = pA[0];

									enlivenObject.clipPath = _enlivenObject.clipPath;
								
								});
							}
							
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
        
						// Add object
						if (nextAction.status === 'added') {    
							const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
							const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;

							if (prevAction !== undefined) {
								util.enlivenObjects([ prevAction.object ]).then((prevObjects) => {
									const pA = prevObjects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
									const _enlivenObject : FabricObject & { id?: number } = pA[0];

									enlivenObject.clipPath = _enlivenObject.clipPath;
								
								});
							}

							// Set erasable to true, is undefined as the property is from erase2d and not fabricjs
							enlivenObject.erasable = true;
							prevState.add(enlivenObject);
							
							// revert changes to object
						} else if (nextAction.status === 'modified') {

							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);
						
							if (!foundObject) {
								return;
							}
							// In case the object is a textbox we need to typecast as getObjects() returns a FabricObject. 
							// At the time of writing this there is no Canvas method to get Textbox objects from the canvas.
							if (foundObject && Object.hasOwn(foundObject, 'text') && Object.hasOwn(enlivenObject, 'text')) {
								const foundTextbox = foundObject as IText;
								const enlivenTextbox = enlivenObject as IText;

								foundTextbox.set({ text: enlivenTextbox.text });
							}

							foundObject.clipPath = enlivenObject.clipPath;
							foundObject.set({ angle: enlivenObject.angle, width: enlivenObject.width, height: enlivenObject.height, scaleX: enlivenObject.scaleX, scaleY: enlivenObject.scaleY, dirty: true });
							foundObject?.setXY(enlivenObject.getXY());
						
							// Call to update state on canvas
							foundObject?.setCoords();
							prevState.renderAll();
							
							// Remove object
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

	const handleDownloadCanvasAsImage = (fileType: ImageFormat) => {
		setCanvas((prevState) => {
			if (prevState) {

				const file = prevState.toDataURL({ format: fileType, multiplier: 1 });
				const downloadlink = document.createElement('a');

				downloadlink.href = file;
				downloadlink.download = 'canvas-image';
				downloadlink.click();
			}

			return prevState;
		});
	};

	const handleDownloadCanvasAsSvg = () => {
		setCanvas((prevState) => {
			if (prevState) {

				const file = prevState.toSVG();
				const downloadlink = document.createElement('a');

				downloadlink.setAttribute('href', `data:image/svg+xml;base64,${window.btoa(file)}`);
				downloadlink.setAttribute('download', 'canvas-image.svg');
				downloadlink.click();
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
							aria-label="Use Edit Tool"
							onClick={handleUseEditTool}
							title="Use Edit Tool"
							style={{ border: tool === 'edit' ? '2px solid gray' : '2px solid lightgray' }}
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
						{/* Download Canvas */}
						<DownloadCanvasButton
							handleDownloadCanvasAsImage={handleDownloadCanvasAsImage}
							handleDownloadCanvasAsSvg={handleDownloadCanvasAsSvg}
							disabled={pastActions.length === 0 && futureActions.length === 0}
						/>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

export default DrawingView;
