import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';

interface Props {
	type: string;
	paletteColors: string[];
	paletteColor: string;
	handleUsePaletteColor: (selectedColor: string) => void;
}

const Row: React.FC<Props> = (props) => {
  
	const { type, paletteColors, paletteColor, handleUsePaletteColor } = props; // eslint-disable-line

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