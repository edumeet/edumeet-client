import MoreIcon from '@mui/icons-material/MoreVert';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { useState } from 'react';
import PeerMenu from '../peermenu/PeerMenu';
import { usePeerConsumers, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';

interface PeerActionsButtonProps extends ControlButtonProps {
	peerId: string;
}

const PeerActionsButton = ({
	peerId,
	...props
}: PeerActionsButtonProps): JSX.Element => {
	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(peerId);

	const shoudShow = peerId && (isModerator || 
	micConsumer || webcamConsumer || screenConsumer || extraVideoConsumers.length !== 0);

	const handleMenuClose = () => {
		setMoreAnchorEl(null);
	};

	return (
		<>
			{ shoudShow && (
				<>
					<ControlButton
						onClick={(event) => {
							setMoreAnchorEl(event.currentTarget);
						}}
						{ ...props }
					>
						<MoreIcon />
					</ControlButton>
					<PeerMenu
						anchorEl={moreAnchorEl}
						anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
						transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
						peerId={peerId}
						onClick={handleMenuClose}
					/>
				</>
			) }
		</>
	);
};

export default PeerActionsButton;