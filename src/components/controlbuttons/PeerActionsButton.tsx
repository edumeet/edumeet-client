import MoreIcon from '@mui/icons-material/MoreVert';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { useState } from 'react';
import PeerMenu from '../peermenu/PeerMenu';

interface PeerActionsButtonProps extends ControlButtonProps {
	peerId: string;
}

const PeerActionsButton = ({
	peerId,
	...props
}: PeerActionsButtonProps): JSX.Element => {
	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMoreAnchorEl(null);
	};

	return (
		<>
			{ peerId && (
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