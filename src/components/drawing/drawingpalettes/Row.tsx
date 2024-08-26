import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';
import { Drawing } from '../../../store/slices/roomSlice';

interface Props {
	paletteColors: Drawing['colors'];
	paletteColor: Drawing['color'];
	handleUsePaletteColor: (selectedColor: Drawing['color']) => void; // eslint-disable-line
}

const Row: React.FC<Props> = (props) => {
  
	const { paletteColors, paletteColor, handleUsePaletteColor } = props;

	return <>
		{paletteColors.map((value) => (
			<IconButton
				key={value}
				aria-label={`Use ${value} color`}
				title={value}
				onClick={() => handleUsePaletteColor(value)}
				style={{ border: paletteColor === value ? '2px solid gray' : '2px solid lightgray' }}
				size='small'
			>
				<CircleIcon
					style={{ color: value }}
				/>
			</IconButton>
		))}
	</>;

};

export default Row;