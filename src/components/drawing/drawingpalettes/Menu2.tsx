import CircleIcon from '@mui/icons-material/Circle';
import { Select, MenuItem } from '@mui/material';

interface Props {
	type: string;
	paletteColors: string[];
	paletteColor: string;
	handleUsePaletteColor: (selectedColor: string) => void;
}

const Menu2: React.FC<Props> = (props) => {
  
	const { type, paletteColors, paletteColor, handleUsePaletteColor } = props; // eslint-disable-line

	return <>
		<Select
			value={paletteColor}
			onChange={(event) => handleUsePaletteColor(event.target.value as string)}
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