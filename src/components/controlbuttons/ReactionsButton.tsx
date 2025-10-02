import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import { useState } from 'react';
import ControlButton, { ControlButtonProps } from './ControlButton';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ClapIcon from '@mui/icons-material/SignLanguage';
import PartyIcon from '@mui/icons-material/Celebration';
import LaughIcon from '@mui/icons-material/SentimentVerySatisfied';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { MenuItem } from '@mui/material'; // Using MenuItem directly for now
import { setSendReaction } from '../../store/actions/meActions';
import { reactionsLabel } from '../translated/translatedComponents';

// Define reaction types
const reactionTypes = [
	{ id: 'laugh', icon: <LaughIcon fontSize="small" /> },
    { id: 'party', icon: <PartyIcon fontSize="small" /> },
    { id: 'clap', icon: <ClapIcon fontSize="small" /> },
    { id: 'thumbup', icon: <ThumbUpIcon fontSize="small" /> },
];

const ReactionsButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		sendReactionInProgress
	} = useAppSelector((state) => state.me);

	const [ menuAnchorEl, setMenuAnchorEl ] = useState<HTMLElement | null>(null);
	const isMenuOpen = Boolean(menuAnchorEl);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setMenuAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setMenuAnchorEl(null);
	};

	return (
		<>
			<ControlButton
				toolTip={reactionsLabel()}
				onClick={handleMenuOpen}
				disabled={sendReactionInProgress}
				{...props}
			>
				<LaughIcon />
			</ControlButton>
			<FloatingMenu
				anchorEl={menuAnchorEl}
				open={isMenuOpen}
				onClose={handleMenuClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				{reactionTypes.map((reaction) => (
					<MenuItem
						key={reaction.id}
						onClick={() => {
							dispatch(setSendReaction(reaction.id));
							handleMenuClose();
						}}
					>
						{reaction.icon}
					</MenuItem>
				))}
			</FloatingMenu>
		</>
	);
};

export default ReactionsButton;
