import { styled } from '@mui/material/styles';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector,
} from '../../store/hooks';
import { MediaState } from '../../utils/types';
import {
	videoUnsupportedLabel,
	stopVideoLabel,
	startVideoLabel
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
import { HoverBox } from './HoverBox';

const WebcamStateIcon = ({ webcamState }: { webcamState: MediaState }): JSX.Element => {
	const OnIcon = styled(VideoIcon)({ position: 'absolute' });

	const OffIcon = styled(VideoOffIcon)({ position: 'absolute' });

	return webcamState === 'on' ? <OnIcon /> : <OffIcon />;
};

const WebcamButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasVideoPermission = usePermissionSelector(permissions.SHARE_VIDEO);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const { canSendWebcam, videoInProgress } = useAppSelector((state) => state.me);

	const [ webcamMoreAnchorEl, setWebcamMoreAnchorEl ] = useState<HTMLElement | null>();
	const isWebcamMoreOpen = Boolean(webcamMoreAnchorEl);

	const [ hover, setHover ] = useState<boolean>(false);
	const handleHoverOn = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		event.stopPropagation();
		setWebcamMoreAnchorEl(event?.currentTarget);
		setHover(false);
	};

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

	return (
		<Box
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			<ControlButton
				sx={{ position: 'relative' }}
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
				<WebcamStateIcon webcamState={webcamState} />
				<HoverBox
					hovered={hover}
					onClick={(event) => handleHoverOn(event)}>
					<ExpandLessIcon />
				</HoverBox>
			</ControlButton>

			<Box
				onClick={() => {
					setHover(false);
					setWebcamMoreAnchorEl(null);
				}}>
				<FloatingMenu
					anchorEl={webcamMoreAnchorEl}
					open={isWebcamMoreOpen}
					onClose={() => setWebcamMoreAnchorEl(null)}
					anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<VideoInputList />
				</FloatingMenu>
			</Box>
		</Box>
	);
};

export default WebcamButton;
