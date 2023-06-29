import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import PanIconFilled from '@mui/icons-material/BackHand';
import PanIcon from '@mui/icons-material/BackHandOutlined';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	raiseHandLabel,
} from '../translated/translatedComponents';
import { setRaisedHand } from '../../store/actions/meActions';

const RaiseHandButton = ({
	size,
	...props
} : ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		raisedHand,
		raisedHandInProgress
	} = useAppSelector((state) => state.me);

	return (
		<ControlButton
			toolTip={raiseHandLabel()}
			onClick={() => {
				dispatch(setRaisedHand(!raisedHand));
			}}
			disabled={raisedHandInProgress}
			size={size}
			{ ...props }
		>
			{ raisedHand ? <PanIconFilled fontSize={size} /> : <PanIcon fontSize={size} /> }
		</ControlButton>
	);
};

export default RaiseHandButton;