import { useState } from 'react';
import PeerMenu from '../peermenu/PeerMenu';
import { useAppSelector, usePeerConsumers, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import MoreButton from './MoreButton';

interface PeerActionsButtonProps {
	peerId: string;
}

const PeerActionsButton = ({
	peerId
}: PeerActionsButtonProps): React.JSX.Element => {
	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const chatEnabled = useAppSelector((state) => state.room.chatEnabled);
	const { micConsumer } = usePeerConsumers(peerId);

	const shouldShow = Boolean(peerId && (isModerator || micConsumer || (chatEnabled && canChat)));

	const handleMenuClose = () => {
		setMoreAnchorEl(null);
	};

	return (
		<>
			{ shouldShow && (
				<>
					<MoreButton onClick={(event) => setMoreAnchorEl(event.currentTarget)} />
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