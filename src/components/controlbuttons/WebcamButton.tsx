import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	videoUnsupportedLabel,
	stopVideoLabel,
	startVideoLabel,
	backgroundBlurLabel
} from '../translated/translatedComponents';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VideoIcon from '@mui/icons-material/Videocam';
import VideoOffIcon from '@mui/icons-material/VideocamOff';
import { useState } from 'react';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { stopWebcam, updateWebcam } from '../../store/actions/mediaActions';
import { permissions } from '../../utils/roles';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { Box } from '@mui/material';
import VideoInputList from '../devicechooser/VideoInputList';
import { BlurButton } from '../settingsdialog/SettingsSwitches';

const WebcamButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasVideoPermission = usePermissionSelector(permissions.SHARE_VIDEO);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const { canSendWebcam, videoInProgress } = useAppSelector((state) => state.me);

	let webcamState: MediaState, webcamTip;

	if (!canSendWebcam || !hasVideoPermission) {
		webcamState = 'unsupported';
		webcamTip = videoUnsupportedLabel();
	} else if (webcamEnabled) {
		webcamState = 'on';
		webcamTip = stopVideoLabel();
	} else {
		webcamState = 'off';
		webcamTip = startVideoLabel();
	}

	const [ webcamMoreAnchorEl, setWebcamMoreAnchorEl ] = useState<HTMLElement | null>();
	const isWebcamMoreOpen = Boolean(webcamMoreAnchorEl);
	const handleWebcamMoreClose = () => setWebcamMoreAnchorEl(null);

	return (
		<Box sx={{ '&:hover .expand-icon': { opacity: 1 } }}>
			<ControlButton
				toolTip={webcamTip}
				onClick={() => {
					if (webcamState === 'unsupported') return;

					if (webcamState === 'off') {
						dispatch(updateWebcam());
					} else {
						dispatch(stopWebcam());
					}
				}}
				disabled={webcamState === 'unsupported' || videoInProgress}
				on={webcamState === 'on'}
				{ ...props }
			>
				{ webcamState === 'on' ? <VideoIcon /> : <VideoOffIcon /> }
				<Box
					className='expand-icon'
					sx={{ opacity: 0, position: 'absolute', top: 0, right: '-1vw' }}
					onClick={(event) => {
						event.stopPropagation();
						setWebcamMoreAnchorEl(event?.currentTarget);
					}}>
					<ExpandLessIcon />
				</Box>
			</ControlButton>
			<FloatingMenu
				anchorEl={webcamMoreAnchorEl}
				open={isWebcamMoreOpen}
				onClose={handleWebcamMoreClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<VideoInputList />
				<BlurButton/>{ backgroundBlurLabel() }
			</FloatingMenu>
		</Box>
	);
};

export default WebcamButton;
