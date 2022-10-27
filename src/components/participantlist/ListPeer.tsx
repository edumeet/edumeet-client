import { IconButton, styled } from '@mui/material';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/PanTool';
import { useAppDispatch, usePeerConsumers } from '../../store/hooks';
import { lowerPeerHand } from '../../store/actions/peerActions';
import Volume from '../volume/Volume';
import { Fragment, useState } from 'react';
import MoreIcon from '@mui/icons-material/MoreVert';
import PeerMenu from '../peermenu/PeerMenu';

interface ListPeerProps {
	peer: Peer;
	isModerator: boolean;
}

const PeerDiv = styled('div')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex'
});

const PeerInfoDiv = styled('div')(({ theme }) => ({
	fontSize: '1rem',
	display: 'flex',
	paddingLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const PeerAvatar = styled('img')({
	borderRadius: '50%',
	height: '2rem',
	width: '2rem',
	objectFit: 'cover',
	backgroundRepeat: 'no-repeat',
	backgroundPosition: 'center center',
	// eslint-disable-next-line quotes
	backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'%3e%3cpath d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' /%3e%3c/svg%3e")`,
});

const ListPeer = ({
	peer,
	isModerator
}: ListPeerProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const {
		micConsumer,
	} = usePeerConsumers(peer.id);

	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMoreAnchorEl(null);
	};

	return (
		<Fragment>
			<PeerDiv>
				<PeerAvatar src={peer.picture} />
				<PeerInfoDiv>{ peer.displayName }</PeerInfoDiv>
				{ peer.raisedHand &&
					<IconButton
						disabled={!isModerator || peer.raisedHandInProgress}
						onClick={(): void => {
							dispatch(lowerPeerHand(peer.id));
						}}
					>
						<PanIcon />
					</IconButton>
				}
				{ micConsumer && <Volume consumer={micConsumer} small /> }
				<IconButton
					aria-haspopup
					onClick={(event) => {
						setMoreAnchorEl(event.currentTarget);
					}}
					color='inherit'
				>
					<MoreIcon />
				</IconButton>
			</PeerDiv>
			<PeerMenu
				anchorEl={moreAnchorEl}
				peerId={peer.id}
				onClick={handleMenuClose}
			/>
		</Fragment>
	);
};

export default ListPeer;