import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import PanIconFilled from '@mui/icons-material/BackHand';
import PanIcon from '@mui/icons-material/BackHandOutlined';
import ControlButton, { ControlButtonProps } from './ControlButton';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ClapIcon from '@mui/icons-material/SignLanguage';
import PartyIcon from '@mui/icons-material/Celebration';
import LaughIcon from '@mui/icons-material/SentimentVerySatisfied';
import { raiseHandLabel } from '../translated/translatedComponents';
import { useRef, useState } from 'react';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { styled } from '@mui/material/styles';
import { Box, Divider, MenuItem } from '@mui/material';
import { setRaisedHand } from '../../store/actions/meActions';
import SettingsBadge from '../settingsbadge/SettingsBadge';
import { setSendReaction } from '../../store/actions/meActions';

const reactionTypes = [
	{ id: 'laugh', icon: <LaughIcon fontSize="small" /> },
    { id: 'party', icon: <PartyIcon fontSize="small" /> },
    { id: 'clap', icon: <ClapIcon fontSize="small" /> },
    { id: 'thumbup', icon: <ThumbUpIcon fontSize="small" /> },
];

const Container = styled(Box)(() => ({
	position: 'relative',
}));

const RaiseHandButton = ({
	size,
	...props
} : ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		raisedHand,
		raisedHandInProgress,
		sendReactionInProgress
	} = useAppSelector((state) => state.me);

	const raiseHandEnabled = useAppSelector((state) => state.room.raiseHandEnabled);
	const reactionsEnabled = useAppSelector((state) => state.room.reactionsEnabled);

	const anchorRef = useRef<HTMLDivElement>(null);
	const timeout = useRef<NodeJS.Timeout>();

	const [ raiseHandMoreAnchorEl, setRaiseHandMoreAnchorEl ] = useState<HTMLElement | null>();
	const isRaiseHandMoreOpen = Boolean(raiseHandMoreAnchorEl);

	const handleOpenSelect = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		event.stopPropagation();
		setRaiseHandMoreAnchorEl(event?.currentTarget);
	};

	const handleTouchStart = () => {
		if (!anchorRef.current) return;

		timeout.current = setTimeout(() => {
			setRaiseHandMoreAnchorEl(anchorRef.current);
		}, 300);
	};

	return (
		<Container
			onTouchStart={handleTouchStart}
			onTouchEnd={() => timeout.current && clearTimeout(timeout.current)}>
			<ControlButton
				toolTip={raiseHandLabel()}
				onClick={() => {
					dispatch(setRaisedHand(!raisedHand));
				}}
				disabled={raisedHandInProgress || !raiseHandEnabled}
				size={size}
				{ ...props }
			>
				{ raisedHand ? <PanIconFilled fontSize={size} /> : <PanIcon fontSize={size} /> }
			</ControlButton>

			{ reactionsEnabled && (
				<SettingsBadge
					color='primary'
					onClick={(event) => handleOpenSelect(event)} />
			) }

			<Box
				ref={anchorRef}
				onClick={() => setRaiseHandMoreAnchorEl(null)}>
				<FloatingMenu
					anchorEl={raiseHandMoreAnchorEl}
					open={isRaiseHandMoreOpen}
					onClose={() => setRaiseHandMoreAnchorEl(null)}
					anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<Divider/>
					{reactionTypes.map((reaction) => (
					<MenuItem
						key={reaction.id}
						onClick={() => {
							dispatch(setSendReaction(reaction.id));
						}}
						disabled={sendReactionInProgress}
					>
						{reaction.icon}
					</MenuItem>
				))}
				</FloatingMenu>
			</Box>
		</Container>
	);
};

export default RaiseHandButton;