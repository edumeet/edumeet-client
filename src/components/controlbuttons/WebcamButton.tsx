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
import { useRef, useState } from 'react';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { stopWebcam, updateWebcam } from '../../store/actions/mediaActions';
import { permissions } from '../../utils/roles';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { Box } from '@mui/material';
import VideoInputList from '../devicechooser/VideoInputList';
import PulsingBadge from '../pulsingbadge/PulsingBadge';

const Container = styled(Box)(() => ({
	position: 'relative',
}));

const FloatingBadge = styled(PulsingBadge)(() => ({
	position: 'absolute',
	top: 0,
	right: -1,
}));

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

	const anchorRef = useRef<HTMLDivElement>(null);
	const timeout = useRef<NodeJS.Timeout>();

	const [ webcamMoreAnchorEl, setWebcamMoreAnchorEl ] = useState<HTMLElement | null>();
	const isWebcamMoreOpen = Boolean(webcamMoreAnchorEl);

    // eslint-disable-next-line
	const handleOpenSelect = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		event.stopPropagation();
		setWebcamMoreAnchorEl(event?.currentTarget);
	};

	const handleTouchStart = () => {
		if (!anchorRef.current) return;

		timeout.current = setTimeout(() => {
			setWebcamMoreAnchorEl(anchorRef.current);
		}, 300);
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
		<Container
			onTouchStart={handleTouchStart}
			onTouchEnd={() => timeout.current && clearTimeout(timeout.current)}>

			{
				webcamEnabled && (
					<FloatingBadge
						color='primary'
						badgeContent={<ExpandLessIcon />}
						onClick={(event) => handleOpenSelect(event)} />
				)
			}

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
				<WebcamStateIcon webcamState={webcamState} />
			</ControlButton>

			<Box
				ref={anchorRef}
				onClick={() => setWebcamMoreAnchorEl(null)}>
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
		</Container>
	);
};

export default WebcamButton;
