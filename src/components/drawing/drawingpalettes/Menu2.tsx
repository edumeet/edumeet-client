import CircleIcon from '@mui/icons-material/Circle';
import { Select, MenuItem } from '@mui/material';
import { RoomState } from '../../../store/slices/roomSlice';

interface Props {
	paletteColors: RoomState['drawing']['colors'];
	paletteColor: RoomState['drawing']['color'];
	handleUsePaletteColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const Menu2: React.FC<Props> = (props) => {
  
	const { paletteColors, paletteColor, handleUsePaletteColor } = props;

	return <>
		<Select
			value={paletteColor}
			onChange={(event) => handleUsePaletteColor(event.target.value as RoomState['drawing']['color'])}
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