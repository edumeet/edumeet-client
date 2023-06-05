import FloatingMenu from '../floatingmenu/FloatingMenu';
import { usePeer, usePeerConsumers, usePermissionSelector } from '../../store/hooks';
import AudioGainSlider from '../audiogainslider/AudioGainSlider';
import MuteAudio from '../menuitems/MuteAudio';
import MuteWebcam from '../menuitems/MuteWebcam';
import MuteScreenshare from '../menuitems/MuteScreenshare';
import { Divider } from '@mui/material';
import { permissions } from '../../utils/roles';
import StopAudio from '../menuitems/StopAudio';
import StopVideo from '../menuitems/StopVideo';
import StopScreenshare from '../menuitems/StopScreenshare';
import Kick from '../menuitems/Kick';

interface PeerMenuProps {
	anchorEl: HTMLElement | null | undefined;
	anchorOrigin?: {
		vertical: number | 'top' | 'center' | 'bottom';
		horizontal: number | 'center' | 'left' | 'right';
	};
	transformOrigin?: {
		vertical: number | 'top' | 'center' | 'bottom';
		horizontal: number | 'center' | 'left' | 'right';
	};
	peerId: string;
	onClick?: () => void;
}

const PeerMenu = ({
	anchorEl,
	anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
	transformOrigin = { vertical: 'top', horizontal: 'left' },
	peerId,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onClick = (): void => {}
}: PeerMenuProps): JSX.Element => {
	const peer = usePeer(peerId);
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(peerId);

	const isMoreMenuOpen = Boolean(anchorEl);

	return (
		<>
			{ peer && (
				<FloatingMenu
					anchorEl={anchorEl}
					anchorOrigin={anchorOrigin}
					transformOrigin={transformOrigin}
					open={isMoreMenuOpen}
					onClose={onClick}
				>
					{ micConsumer && <AudioGainSlider consumer={micConsumer} /> }
					{ micConsumer && <MuteAudio onClick={onClick} peer={peer} micConsumer={micConsumer} /> }
					{ webcamConsumer && <MuteWebcam onClick={onClick} peer={peer} webcamConsumer={webcamConsumer} /> }
					{ screenConsumer && <MuteScreenshare onClick={onClick} peer={peer} screenConsumer={screenConsumer} /> }
					{ extraVideoConsumers.map((consumer) => <MuteWebcam onClick={onClick} key={consumer.id} peer={peer} webcamConsumer={consumer} />) }
					{ isModerator && <Divider /> }
					{ isModerator && micConsumer && <StopAudio onClick={onClick} peer={peer} /> }
					{ isModerator && webcamConsumer && <StopVideo onClick={onClick} peer={peer} /> }
					{ isModerator && screenConsumer && <StopScreenshare onClick={onClick} peer={peer} /> }
					{ isModerator && <Kick onClick={onClick} peer={peer} /> }
				</FloatingMenu>
			) }
		</>
	);
};

export default PeerMenu;