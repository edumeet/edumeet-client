import MicOff from '@mui/icons-material/MicOff';
import RaiseHand from '@mui/icons-material/BackHand';
import { useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';

const MeStateIndicators = (): JSX.Element => {
	const { micProducer } = useAppSelector(meProducersSelector);
	const raisedHand = useAppSelector((state) => state.me.raisedHand);

	return (
		<>
			{ (!micProducer || micProducer?.paused) && <MicOff color='error' fontSize='small' /> }
			{ raisedHand && <RaiseHand fontSize='small' /> }
		</>
	);
};

export default MeStateIndicators;
