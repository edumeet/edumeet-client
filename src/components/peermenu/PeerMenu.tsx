import FloatingMenu from '../floatingmenu/FloatingMenu';
import { usePeer, usePeerConsumers, usePermissionSelector, useAppSelector } from '../../store/hooks';
import AudioGainSlider from '../audiogainslider/AudioGainSlider';
import { permissions } from '../../utils/roles';
import StopAudio from '../menuitems/StopAudio';
import StopVideo from '../menuitems/StopVideo';
import StopScreenshare from '../menuitems/StopScreenshare';
import Kick from '../menuitems/Kick';
import SendPrivateMessage from '../menuitems/SendPrivateMessage';

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
	displayName?: string;
	onClick?: () => void;
}

const PeerMenu = ({
	anchorEl,
	anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
	transformOrigin = { vertical: 'top', horizontal: 'left' },
	peerId,
	displayName,
	onClick = (): void => {}
}: PeerMenuProps): React.JSX.Element => {
	const peer = usePeer(peerId);
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const chatEnabled = useAppSelector((state) => state.room.chatEnabled);
	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
	} = usePeerConsumers(peerId);

	const isMoreMenuOpen = Boolean(anchorEl);

	return (
		<FloatingMenu
			anchorEl={anchorEl}
			anchorOrigin={anchorOrigin}
			transformOrigin={transformOrigin}
			open={isMoreMenuOpen}
			onClose={onClick}
		>
			{ chatEnabled && canChat &&
				<SendPrivateMessage onClick={onClick} peerId={peerId} displayName={peer?.displayName ?? displayName} /> }
			{ peer && micConsumer && <AudioGainSlider consumer={micConsumer} /> }
			{ peer && isModerator && micConsumer && <StopAudio onClick={onClick} peer={peer} /> }
			{ peer && isModerator && webcamConsumer && <StopVideo onClick={onClick} peer={peer} /> }
			{ peer && isModerator && screenConsumer && <StopScreenshare onClick={onClick} peer={peer} /> }
			{ peer && isModerator && <Kick onClick={onClick} peer={peer} /> }
		</FloatingMenu>
	);
};

export default PeerMenu;
