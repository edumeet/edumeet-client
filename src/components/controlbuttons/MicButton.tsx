import { styled } from '@mui/material/styles';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	activateAudioLabel,
	audioUnsupportedLabel,
	muteAudioLabel,
	unmuteAudioLabel
} from '../translated/translatedComponents';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { pauseMic, resumeMic, updateMic } from '../../store/actions/mediaActions';
import { permissions } from '../../utils/roles';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { Box } from '@mui/material';
import AudioInputList from '../devicechooser/AudioInputList';
import { HoverBox } from './HoverBox';

const MicStateIcon = ({ micState }: { micState: MediaState }): JSX.Element => {
	const OnIcon = styled(MicIcon)({ position: 'absolute' });

	const OffIcon = styled(MicOffIcon)({ position: 'absolute' });

	return micState === 'on' ? <OnIcon /> : <OffIcon />;
};

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const { canSendMic, audioInProgress } = useAppSelector((state) => state.me);

	const [ micMoreAnchorEl, setMicMoreAnchorEl ] = useState<HTMLElement | null>();
	const isMicMoreOpen = Boolean(micMoreAnchorEl);

	const [ hover, setHover ] = useState<boolean>(false);
	const handleHoverOn = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		event.stopPropagation();
		setMicMoreAnchorEl(event?.currentTarget);
		setHover(false);
	};

	let micState: MediaState, micTip;

	if (!canSendMic || !hasAudioPermission) {
		micState = 'unsupported';
		micTip = audioUnsupportedLabel();
	} else if (micEnabled && !audioMuted) {
		micState = 'on';
		micTip = muteAudioLabel();
	} else if (micEnabled && audioMuted) {
		micState = 'muted';
		micTip = unmuteAudioLabel();
	} else {
		micState = 'off';
		micTip = activateAudioLabel();
	}

	return (
		<Box
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			<ControlButton
				sx={{ position: 'relative' }}
				toolTip={micTip}
				onClick={() => {
					if (micState === 'unsupported') return;

					if (micState === 'off') {
						dispatch(updateMic());
					} else if (micState === 'muted') {
						dispatch(resumeMic());
					} else {
						dispatch(pauseMic());
					}
				}}
				disabled={micState === 'unsupported' || audioInProgress}
				on={micState === 'on'}
				{...props}
			>
				<MicStateIcon micState={micState} />
				<HoverBox
					hovered={hover}
					onClick={(event) => handleHoverOn(event)}>
					<ExpandLessIcon />
				</HoverBox>
			</ControlButton>

			<Box
				onClick={() => {
					setHover(false);
					setMicMoreAnchorEl(null);
				}}>
				<FloatingMenu
					anchorEl={micMoreAnchorEl}
					open={isMicMoreOpen}
					onClose={() => setMicMoreAnchorEl(null)}
					anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<AudioInputList />
				</FloatingMenu>
			</Box>
		</Box>
	);
};

export default MicButton;
