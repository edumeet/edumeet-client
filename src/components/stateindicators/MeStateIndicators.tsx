import MicOff from '@mui/icons-material/MicOff';
import RaiseHand from '@mui/icons-material/BackHand';
import { useAppSelector } from '../../store/hooks';

const MeStateIndicators = (): JSX.Element => {
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const raisedHand = useAppSelector((state) => state.me.raisedHand);

	return (
		<>
			{ audioMuted && <MicOff color='error' fontSize='small' /> }
			{ raisedHand && <RaiseHand fontSize='small' /> }
		</>
	);
};

export default MeStateIndicators;
