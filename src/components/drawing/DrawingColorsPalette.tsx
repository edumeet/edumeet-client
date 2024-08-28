import React from 'react';
import Row from './colorsMenus/Row';
import Menu from './colorsMenus/Menu';
import { RoomState } from '../../store/slices/roomSlice';

interface Props {
	type: RoomState['drawing']['colorsMenu'];
	paletteColors: RoomState['drawing']['colors'];
	paletteColor: RoomState['drawing']['color'];
	handleUsePaletteColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const DrawingColorsPalette: React.FC<Props> = (props) => {
  
	const Component = { Row, Menu }[props.type] || null;

	return Component ? <Component {...props} /> : null;

};

export default DrawingColorsPalette;