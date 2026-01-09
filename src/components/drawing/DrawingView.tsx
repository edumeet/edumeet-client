import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { drawingActions, DrawingState } from '../../store/slices/drawingSlice';
import { clearCanvas, setDrawingBgColor, updateCanvasState } from '../../store/actions/drawingActions';

import { Canvas, FabricObject, ImageFormat, IText, PencilBrush, util } from 'fabric';
import { EraserBrush, isTransparent } from '@erase2d/fabric';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
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
import { isMobileSelector } from '../../store/selectors';

interface DrawingViewProps {
	width: number;
	height: number;
}

const DrawingView = ({ width, height }: DrawingViewProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
    
	// drawing setup   
	const isMobile = useAppSelector(isMobileSelector);
	const showEdit = true; // Visual feedback for other clients
	const disableDraw = isMobile; // Disables drawing for some - currently only mobile
	
	// canvas
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ canvas, setCanvas ] = useState<Canvas>();
	const zoom = useAppSelector((state) => state.drawing.zoom);
	const initiateActions = useAppSelector((state) => state.drawing.initiateAction);
	const clearAction = useAppSelector((state) => state.drawing.clearAction);
	
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
	const [ isColorsPickerPopover, setIsColorsPickerPopover ] = useState<boolean>(false);
	const colorsPicker = useAppSelector((state) => state.drawing.colorsPicker);
	const colors = useAppSelector((state) => state.drawing.colors);
	const color = useAppSelector((state) => state.drawing.color);
	const bgColors = useAppSelector((state) => state.drawing.bgColors);
	const bgColor = useAppSelector((state) => state.drawing.bgColor);
	
	// history
	const actionRef = useRef< 'text' | 'undo' | 'redo' | 'select' | 'clear' | 'update' | null>(null);
	const pastActions = useAppSelector((state) => state.drawing.history.past);
	const futureActions = useAppSelector((state) => state.drawing.history.future);
	const updateAction = useAppSelector((state) => state.drawing.updateAction);
	const addedObjectsRef = useRef<FabricObject[]>([]);

	/* create canvas object */
	useEffect(() => {

		if (canvasRef.current) {
			// Create a new canvas
			setCanvas(new Canvas(canvasRef.current, {
				backgroundColor: bgColor,
			}));

			initateCanvas();
			
			setCanvas((prevState) => {
				if (prevState) {
					
					const handleObjectEvent = (status: 'added' | 'modified' | 'removed') => (obj: {target: FabricObject}) => {	
						if (actionRef.current === null) {
					
							const object = obj.target as FabricObject;

							object.erasable = Object.hasOwn(object, 'text') ? false : true;
							object.id = object.id ?? Date.now();

							dispatch(drawingActions.recordAction({ object: object.toObject(), status }));
							dispatch(updateCanvasState({ object: object.toObject(), status }));
						}
					};

					const handleObjectMove = (status: 'editing' | 'lock') => (obj: {target: FabricObject}) => {
						const object = obj.target;

						dispatch(updateCanvasState({ object: object.toObject(), status }));
					};
					
					prevState.on('object:added', handleObjectEvent('added'));
					prevState.on('object:modified', handleObjectEvent('modified'));
					prevState.on('object:removed', handleObjectEvent('removed'));

					// Visual feedback to other participants on transforming objects
					if (showEdit) {
						prevState.on('object:moving', handleObjectMove('editing'));
						prevState.on('object:rotating', handleObjectMove('editing'));
						prevState.on('object:scaling', handleObjectMove('editing'));
					} else { // ensure object are not selectable even if no visual feedback is given for other clients
						prevState.on('object:moving', handleObjectMove('lock'));
						prevState.on('object:rotating', handleObjectMove('lock'));
						prevState.on('object:scaling', handleObjectMove('lock'));
					}
				}
            
				return prevState;
            
			});
		}

		return () => {
			dispatch(drawingActions.clear());
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

			setIsColorsPickerPopover(currWidth < 830 ? true : false);

			return prevState;
		});
			
		handleSetZoom(currScaleFactor);
		
	}, [ width, height ]);

	/* tools */
	useEffect(() => {

		switch (tool) {
			case 'edit':
				setSize(0);
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

	// Clear canvas
	useEffect(() => {
		setCanvas((prevState) => {
			
			actionRef.current = 'clear';
			
			if (prevState) {
				prevState.clear();
				prevState.backgroundColor = bgColor;
				
				actionRef.current = null;
			}
			
			return prevState;
		});

		dispatch(drawingActions.clear());

	}, [ clearAction ]);
	
	// Update objects on canvas when other users makes a change
	useEffect(() => {
		setCanvas((prevState) => {

			if (prevState) {
				actionRef.current = actionRef.current == 'text' ? 'text' : 'update';

				if (updateAction) {

					const updating = util.enlivenObjects([ updateAction.object ]).then((objects) => {
						const uO = objects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
						const enlivenObject : FabricObject = uO[0];
						const textObject = Object.hasOwn(enlivenObject, 'text');
						
						if (updateAction.status == 'added') {

							if (!textObject) {
								enlivenObject.erasable = true;
							}

							enlivenObject.selectable = disableDraw || (actionRef.current == 'text') ? false: true;

							prevState.add(enlivenObject);

							if (!addedObjectsRef.current.some((obj) => obj.id === enlivenObject.id)) {
								addedObjectsRef.current = [ ...addedObjectsRef.current, enlivenObject.toObject() ];
							}

						} else if (updateAction.status == 'modified') {

							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);
							
							if (foundObject) modifyObject(foundObject, enlivenObject, prevState);

							const actionIds = new Set(pastActions.map((act) => act.object.id));

							if (!addedObjectsRef.current.some((obj) => actionIds.has(obj.id))) {
								const idx = addedObjectsRef.current.findIndex((i) => i.id === enlivenObject.id);

								if (idx !== -1) {
									addedObjectsRef.current[idx] = enlivenObject;
								}
							}

						} else if (updateAction.status == 'removed') {

							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							if (foundObject) prevState.remove(foundObject);

						} else if (updateAction.status == 'editing') {

							prevState.getObjects().forEach((curr: FabricObject) => {
								if (curr.id === enlivenObject.id) {
									curr.selectable = false;
									curr.set({ angle: enlivenObject.angle, width: enlivenObject.width, height: enlivenObject.height, scaleX: enlivenObject.scaleX, scaleY: enlivenObject.scaleY, dirty: true });
									curr.setXY(enlivenObject.getXY());
									curr.setCoords();
									prevState.renderAll();
								}

							});

						} else if (updateAction.status == 'lock') {
							prevState.getObjects().forEach((curr: FabricObject) => {
								if (curr.id === enlivenObject.id) {
									curr.selectable = false;
								}

							});
							
						}

					});
					
					updating.finally(() => {
						
						actionRef.current = actionRef.current == 'text' ? 'text' : null;
					});
				}

			}

			return prevState;
		});

	}, [ updateAction ]);

	const initateCanvas = () => {
		setCanvas((prevState) => {
			
			if (prevState) {
				
				if (initiateActions) {
					
					const actionsObj = initiateActions.map((a) => a.object);
					
					const initiating = util.enlivenObjects(actionsObj).then((objects) => {
						actionRef.current = 'update';

						const iO = objects.filter((obj) => obj instanceof FabricObject) as FabricObject[];

						iO.forEach((iObject) => {
							if (!Object.hasOwn(iObject, 'text')) {
								iObject.erasable = true;
							}
							iObject.selectable = disableDraw || (iObject.selectable == false) ? false: true;
							prevState.add(iObject);
	
							addedObjectsRef.current = [ ...addedObjectsRef.current, iObject.toObject() ];

						});
					
					});
				
					initiating.finally(() => {
						actionRef.current = null;
					});
				}
			}
			
			return prevState;
		});
	};

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
					obj.selectable = disableDraw ? false: true;
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
		const strokeColor = bgColor == 'black' ? 'white' : 'black';

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

					// array of all objects on the canvas that erase have been used on
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

	const modifyObject = (oldObject: FabricObject, newObject: FabricObject, prevState: Canvas) => {
		// In case the object is an IText we need to typecast as getObjects() returns a FabricObject. 
		// At the time of writing this there is no Canvas method to get IText objects from the canvas.
		if (Object.hasOwn(oldObject, 'text') && Object.hasOwn(newObject, 'text')) {
			const oldTextbox = oldObject as IText;
			const newTextbox = newObject as IText;
			
			oldTextbox.set({ text: newTextbox.text });
		}

		// erase changes the clipPath - therefore we must set the clipPath to the previous
		oldObject.clipPath = newObject.clipPath;
		
		oldObject.set({ angle: newObject.angle, width: newObject.width, height: newObject.height, scaleX: newObject.scaleX, scaleY: newObject.scaleY, dirty: true });
		oldObject.setXY(newObject.getXY());
		oldObject.selectable = disableDraw || (actionRef.current == 'text') ? false : true;

		// Call to update state on canvas
		oldObject.setCoords();
		prevState.renderAll();
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
						const textObject = Object.hasOwn(enlivenObject, 'text');

						// remove added object
						if (lastAction.status === 'added') {    
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							if (foundObject) prevState.remove(foundObject);
							dispatch(updateCanvasState({ object: lastAction.object, status: 'removed' }));
							
						// revert changes to object
						} else if (lastAction.status === 'modified') {

							// Filter all actions with the same object id and get the object's previous state which is the second newest object
							const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
							const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);
							
							if (prevAction !== undefined) {
								const _undoing = util.enlivenObjects([ prevAction.object ]).then((prevObjects) => {
									actionRef.current = 'undo';

									const _objs = prevObjects.filter((obj) => obj instanceof FabricObject) as FabricObject[];
									const _enlivenObject : FabricObject & { id?: number } = _objs[0];

									if (foundObject && foundObject.id === _enlivenObject.id) {
										modifyObject(foundObject, _enlivenObject, prevState);
										dispatch(updateCanvasState({ object: prevAction.object, status: 'modified' }));
									} else {
										_enlivenObject.erasable = Object.hasOwn(_enlivenObject, 'text') ? false : true;
										prevState.add(_enlivenObject);
										dispatch(updateCanvasState({ object: _enlivenObject, status: 'added' }));
									}
								});

								_undoing.finally(() => {
									actionRef.current = null;
								});

							} else { // Undo case for modify of object other users have created
								const addedObject = addedObjectsRef.current.find((obj: FabricObject) => obj.id === enlivenObject.id);

								const _undoing = util.enlivenObjects([ addedObject ]).then((added) => {
									actionRef.current = 'undo';

									const _objs = added.filter((obj) => obj instanceof FabricObject) as FabricObject[];
									const _enlivenObject : FabricObject & { id?: number } = _objs[0];
								
									if (foundObject && foundObject.id === _enlivenObject.id) {
										modifyObject(foundObject, _enlivenObject, prevState);
										dispatch(updateCanvasState({ object: _enlivenObject, status: 'modified' }));
									} else {
										_enlivenObject.erasable = Object.hasOwn(_enlivenObject, 'text') ? false : true;
										prevState.add(_enlivenObject);
										dispatch(updateCanvasState({ object: _enlivenObject, status: 'added' }));
									}
									
								});

								_undoing.finally(() => {
									actionRef.current = null;
								});
							}

						// add removed object
						} else if (lastAction.status === 'removed') {
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							// Ensure object does not already exist on canvas before adding it back
							if (!foundObject) {

								// Need the previous object and state for cases when objects was erased using eraser tool
								const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
								const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;
								
								if (prevAction !== undefined) {
									enlivenObject.clipPath = prevAction.object.clipPath;
								}
							
								// Set erasable to true, it is undefined by default as the property is from erase2d and not fabricjs
								if (!textObject) {
									enlivenObject.erasable = true;
								}
								prevState.add(enlivenObject);
								dispatch(updateCanvasState({ object: lastAction.object, status: 'added' }));
							}
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
						const textObject = Object.hasOwn(enlivenObject, 'text');
        
						// Add object
						if (nextAction.status === 'added') {  
							const FilteredActions = pastActions.filter((obj: FabricAction) => obj.object.id == enlivenObject.id);
							const prevAction = FilteredActions.length >= 2 ? FilteredActions[FilteredActions.length - 2] : undefined;
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							if (prevAction !== undefined) {
								enlivenObject.clipPath = prevAction.object.clipPath;
							}

							// Set erasable to true, is undefined as the property is from erase2d and not fabricjs
							if (!textObject) {
								enlivenObject.erasable = true;
							}

							if (!foundObject) {
								prevState.add(enlivenObject);
								dispatch(updateCanvasState({ object: nextAction.object, status: 'added' }));
							} else {
								modifyObject(foundObject, enlivenObject, prevState);
								dispatch(updateCanvasState({ object: nextAction.object, status: 'modified' }));
							}
							
							// revert changes to object
						} else if (nextAction.status === 'modified') {

							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);
							
							if (foundObject && foundObject.id === enlivenObject.id) {
								modifyObject(foundObject, enlivenObject, prevState);
								dispatch(updateCanvasState({ object: nextAction.object, status: 'modified' }));
							} else {
								prevState.add(enlivenObject);
								dispatch(updateCanvasState({ object: enlivenObject, status: 'added' }));
							}
							
							// Remove object
						} else if (nextAction.status === 'removed') {
							const foundObject = prevState.getObjects().find((curr: FabricObject) => curr.id === enlivenObject.id);

							if (foundObject) prevState.remove(foundObject);
							dispatch(updateCanvasState({ object: nextAction.object, status: 'removed' }));
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
				dispatch(clearCanvas());

				addedObjectsRef.current = [];

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
				{ !disableDraw && <Grid
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
						{/* Edit */}
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
							disabled = { false }
						/>
					</Grid>
				</Grid> }
			</Grid>
		</Grid>
	);
};

export default DrawingView;
