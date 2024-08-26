import CircleIcon from '@mui/icons-material/Circle';
import { Select, MenuItem } from '@mui/material';
import { Drawing } from '../../../store/slices/roomSlice';

interface Props {
	paletteColors: Drawing['colors'];
	paletteColor: Drawing['color'];
	handleUsePaletteColor: (selectedColor: Drawing['color']) => void; // eslint-disable-line
}

const Menu2: React.FC<Props> = (props) => {
  
	const { paletteColors, paletteColor, handleUsePaletteColor } = props;

	return <>
		<Select
			value={paletteColor}
			onChange={(event) => handleUsePaletteColor(event.target.value as Drawing['color'])}
			style={{ border: '2px solid lightgray' }}
			size='small'
		>
			{paletteColors.map((value) => (
				<MenuItem key={value} value={value} style={{ color: value }}>
					<CircleIcon style={{ color: value }} />
				</MenuItem>
			))}
		</Select>
	</>;

};

export default Menu2;