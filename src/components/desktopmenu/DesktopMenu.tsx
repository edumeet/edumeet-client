import { MenuItem, Paper, Popover } from '@mui/material';
import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions } from '../../utils/roles';
import {
	aboutLabel,
	AboutMessage,
	addVideoLabel,
	AddVideoMessage,
	helpLabel,
	HelpMessage,
	hideSelfViewLabel,
	HideSelfViewMessage,
	showSelfViewLabel,
	ShowSelfViewMessage
} from '../translated/translatedComponents';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SelfViewOnIcon from '@mui/icons-material/Videocam';
import SelfViewOffIcon from '@mui/icons-material/VideocamOff';
import MoreActions from '../moreactions/MoreActions';

interface DesktopmenuProps {
	anchorEl: HTMLElement | null | undefined;
	open: boolean;
	currentMenu: 'moreActions' | 'localeMenu' | null | undefined;
	onClose: () => void;
	onExited: () => void;
}

const DesktopMenu = ({
	anchorEl,
	open,
	currentMenu,
	onClose,
	onExited
}: DesktopmenuProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const canProduceExtraVideo = usePermissionSelector(permissions.EXTRA_VIDEO);

	const {
		extraVideoOpen,
		hideSelfView,
		helpOpen,
		aboutOpen
	} = useAppSelector((state) => state.ui);

	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			open={open}
			onClose={onClose}
			TransitionProps={{
				onExited
			}}
		>
			{ currentMenu === 'moreActions' &&
				<Paper>
					<MenuItem
						disabled={!canProduceExtraVideo}
						onClick={() => {
							onClose();
							dispatch(uiActions.setUi({ extraVideoOpen: !extraVideoOpen }));
						}}
					>
						<VideoCallIcon
							aria-label={addVideoLabel(intl)}
						/>
						<MoreActions>
							<AddVideoMessage />
						</MoreActions>
					</MenuItem>
					<MenuItem
						onClick={() => {
							onClose();
							dispatch(uiActions.setUi({ hideSelfView: !hideSelfView }));
						}}
					>
						{ hideSelfView ?
							<SelfViewOnIcon
								aria-label={showSelfViewLabel(intl)}
							/>
							:
							<SelfViewOffIcon
								aria-label={hideSelfViewLabel(intl)}
							/>
						}
						{ hideSelfView ?
							<MoreActions>
								<ShowSelfViewMessage />
							</MoreActions>
							:
							<MoreActions>
								<HideSelfViewMessage />
							</MoreActions>
						}
					</MenuItem>
					<MenuItem
						onClick={() => {
							onClose();
							dispatch(uiActions.setUi({ helpOpen: !helpOpen }));
						}}
					>
						<HelpIcon
							aria-label={helpLabel(intl)}
						/>
						<MoreActions>
							<HelpMessage />
						</MoreActions>
					</MenuItem>
					<MenuItem
						onClick={() => {
							onClose();
							dispatch(uiActions.setUi({ aboutOpen: !aboutOpen }));
						}}
					>
						<InfoIcon
							aria-label={aboutLabel(intl)}
						/>
						<MoreActions>
							<AboutMessage />
						</MoreActions>
					</MenuItem>
				</Paper>
			}
		</Popover>
	);
};

export default DesktopMenu;