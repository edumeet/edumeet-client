import React from 'react';
import Row from './colorsMenus/Row';
import Menu from './colorsMenus/Menu';
import { RoomState } from '../../store/slices/roomSlice';

interface Props {
	type: RoomState['drawing']['colorsMenu'];
	colors: RoomState['drawing']['colors'];
	color: RoomState['drawing']['color'];
	handleUseColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const DrawingColors: React.FC<Props> = (props) => {
  
	const Component = { Row, Menu }[props.type] || null;

	return Component ? <Component {...props} /> : null;

};

export default DrawingColors;