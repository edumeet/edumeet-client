import React from 'react';
import Row from './drawingpalettes/Row';
import Menu from './drawingpalettes/Menu';
import { RoomState } from '../../store/slices/roomSlice';

interface Props {
	type: string;
	paletteColors: RoomState['drawing']['colors'];
	paletteColor: RoomState['drawing']['color'];
	handleUsePaletteColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const DrawingColorsPallete: React.FC<Props> = (props) => {
  
	const Component = { Row, Menu }[props.type] || null;

	return Component ? <Component {...props} /> : null;

};

export default DrawingColorsPallete;