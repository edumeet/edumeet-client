import React from 'react';
import Row from './drawingpalettes/Row';
import Menu from './drawingpalettes/Menu';
import Menu2 from './drawingpalettes/Menu2';
import { Drawing } from '../../store/slices/roomSlice';

interface Props {
	type: string;
	paletteColors: Drawing['colors'];
	paletteColor: Drawing['color'];
	handleUsePaletteColor: (selectedColor: Drawing['color']) => void; // eslint-disable-line
}

const DrawingColorsPallete: React.FC<Props> = (props) => {
  
	const Component = { Row, Menu, Menu2 }[props.type] || null;

	return Component ? <Component {...props} /> : null;

};

export default DrawingColorsPallete;