import MicOff from '@mui/icons-material/MicOff';
import RaiseHand from '@mui/icons-material/BackHand';
import { useAppSelector } from '../../store/hooks';

const MeStateIndicators = (): JSX.Element => {
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const raisedHand = useAppSelector((state) => state.me.raisedHand);

	return (
		<>
			{ !micEnabled && <MicOff color='error' fontSize='small' /> }
			{ raisedHand && <RaiseHand fontSize='small' /> }
		</>
	);
};

export default MeStateIndicators;
