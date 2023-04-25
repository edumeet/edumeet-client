import { MicOff, Phone, VolumeOff } from '@mui/icons-material';
import { styled } from '@mui/material';
import { usePeer, usePeerConsumers } from '../../store/hooks';

interface StateIndicatorsProps {
	peerId: string;
}

const StyledDiv = styled('div')(({ theme }) => ({
	position: 'absolute',
	top: theme.spacing(1),
	left: theme.spacing(1),
	zIndex: 22,
	'.MuiSvgIcon-root': {
		color: 'red',
		marginRight: theme.spacing(1)
	},
	'.MuiSvgIcon-root:last-child': {
		marginRight: 0
	}
}));

const StateIndicators = ({
	peerId
}: StateIndicatorsProps): JSX.Element => {
	const peer = usePeer(peerId);
	const { micConsumer } = usePeerConsumers(peerId);

	return (
		<StyledDiv>
			{ peer && peer.audioOnly && <Phone /> }
			{ (
				((micConsumer && micConsumer.remotePaused) || !micConsumer) && <MicOff />
			) || (
				micConsumer && micConsumer.localPaused && <VolumeOff />
			) }
		</StyledDiv>
	);
};

export default StateIndicators;