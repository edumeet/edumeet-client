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

const RaiseHandButton = (
	props
: ControlButtonProps): JSX.Element => {
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
			{ ...props }
		>
			{ raisedHand ? <PanIconFilled /> : <PanIcon /> }
		</ControlButton>
	);
};

export default RaiseHandButton;