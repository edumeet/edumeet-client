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
import AudioInputChooser from '../devicechooser/AudioInputChooser';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { Box } from '@mui/material';

interface MicStateIconProps {
  micState: MediaState;
  sx?: object;
}

const MicStateIcon = ({ micState, sx }: MicStateIconProps): JSX.Element => {
	return micState === 'on' ? <MicIcon sx={ sx } /> : <MicOffIcon sx={ sx } />;
};

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const hasAudioPermission = usePermissionSelector(permissions.SHARE_AUDIO);
	const { canSendMic, audioInProgress } = useAppSelector((state) => state.me);

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

	const [ micMoreAnchorEl, setMicMoreAnchorEl ] = useState<HTMLElement | null>();
	const isMicMoreOpen = Boolean(micMoreAnchorEl);
	const handleMicMoreClose = () => setMicMoreAnchorEl(null);

	return (
		<Box sx={{ '&:hover .expand-icon': { opacity: 1 } }}>
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
				<MicStateIcon sx={{ position: 'absolute' }} micState={micState}/>
				<Box
					className='expand-icon'
					sx={{ opacity: 0, position: 'absolute', top: 0, right: '-1vw' }}
					onClick={(event) => {
						event.stopPropagation();
						setMicMoreAnchorEl(event?.currentTarget);
					}}>
					<ExpandLessIcon />
				</Box>
			</ControlButton>

			<FloatingMenu
				anchorEl={micMoreAnchorEl}
				open={isMicMoreOpen}
				onClose={handleMicMoreClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<AudioInputChooser />
			</FloatingMenu>
		</Box>
	);
};

export default MicButton;
