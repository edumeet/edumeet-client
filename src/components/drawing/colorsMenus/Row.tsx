import IconButton from '@mui/material/IconButton';
import CircleIcon from '@mui/icons-material/Circle';
import { RoomState } from '../../../store/slices/roomSlice';

interface Props {
	colors: RoomState['drawing']['colors'];
	color: RoomState['drawing']['color'];
	handleUseColor: (selectedColor: RoomState['drawing']['color']) => void; // eslint-disable-line
}

const Row: React.FC<Props> = (props) => {
  
	const { colors, color, handleUseColor } = props;

	return <>
		{colors.map((value) => (
			<IconButton
				key={value}
				aria-label={`Use ${value} color`}
				title={value}
				onClick={() => handleUseColor(value)}
				style={{ border: color === value ? '2px solid gray' : '2px solid lightgray' }}
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