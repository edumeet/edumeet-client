import MicOff from '@mui/icons-material/MicOff';
import RaiseHand from '@mui/icons-material/BackHand';
import { useAppSelector } from '../../store/hooks';

const MeStateIndicators = (): React.JSX.Element => {
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const raisedHand = useAppSelector((state) => state.me.raisedHand);

	const muted = (micEnabled && audioMuted) || !micEnabled;

	return (
		<>
			{ muted && <MicOff color='error' fontSize='small' /> }
			{ raisedHand && <RaiseHand fontSize='small' /> }
		</>
	);
};

export default MeStateIndicators;
