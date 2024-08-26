import React from 'react';
import Row from './drawingpalettes/Row';
import Menu from './drawingpalettes/Menu';
import Menu2 from './drawingpalettes/Menu2';

interface Props {
	type: string;
	paletteColors: string[];
	paletteColor: string;
	handleUsePaletteColor: (selectedColor: string) => void;
}

const DrawingColorsPallete: React.FC<Props> = (props) => {
  
	const { type, paletteColors, paletteColor, handleUsePaletteColor } = props; // eslint-disable-line

	const Component = {
		'Row': Row,
		'Menu': Menu,
		'Menu2': Menu2
	}[type] || null;
 
	return Component && <Component type={type} paletteColors={paletteColors} paletteColor={paletteColor} handleUsePaletteColor={handleUsePaletteColor} />;
};

export default DrawingColorsPallete;