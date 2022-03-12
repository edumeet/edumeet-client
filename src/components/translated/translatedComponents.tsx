import { FormattedMessage, IntlShape } from 'react-intl';

export const yourNameLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.yourName',
	defaultMessage: 'Your name'
});

export const roomNameLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.roomName',
	defaultMessage: 'Room name'
});

export const ShowSelfViewMessage = (): JSX.Element =>
	<FormattedMessage id='room.showSelfView' defaultMessage='Show self view video' />;

export const showSelfViewLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'room.showSelfView',
	defaultMessage: 'Show self view video'
});

export const HideSelfViewMessage = (): JSX.Element =>
	<FormattedMessage id='room.hideSelfView' defaultMessage='Hide self view video' />;

export const hideSelfViewLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'room.hideSelfView',
	defaultMessage: 'Hide self view video'
});

export const AddVideoMessage = (): JSX.Element =>
	<FormattedMessage id='label.addVideo' defaultMessage='Add video' />;

export const addVideoLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.addVideo',
	defaultMessage: 'Add video'
});

export const showLobbyLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.lobby',
	defaultMessage: 'Show lobby'
});

export const LeaveMessage = (): JSX.Element =>
	<FormattedMessage id='label.leave' defaultMessage='Leave' />;

export const leaveLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.leave',
	defaultMessage: 'Leave'
});

export const HelpMessage = (): JSX.Element =>
	<FormattedMessage id='room.help' defaultMessage='Help' />;

export const helpLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'room.help',
	defaultMessage: 'Help'
});

export const AboutMessage = (): JSX.Element =>
	<FormattedMessage id='room.about' defaultMessage='About' />;

export const aboutLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'room.about',
	defaultMessage: 'About'
});

export const loginLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.login',
	defaultMessage: 'Log in'
});

export const LoginMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.login' defaultMessage='Log in' />;

export const logoutLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.logout',
	defaultMessage: 'Log out'
});

export const LogoutMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.logout' defaultMessage='Log out' />;

export const JoinMessage = (): JSX.Element =>
	<FormattedMessage id='label.join' defaultMessage='Join' />;

export const moreActionsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.moreActions',
	defaultMessage: 'More actions'
});

export const openDrawerLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.openDrawer',
	defaultMessage: 'Open drawer'
});

export const showParticipantsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.participants',
	defaultMessage: 'Show participants'
});

export const ShowParticipantsMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.participants' defaultMessage='Show participants' />;

export const showSettingsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.settings',
	defaultMessage: 'Show settings'
});

export const ShowSettingsMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.settings' defaultMessage='Show settings' />;

export const leaveFullscreenLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.leaveFullscreen',
	defaultMessage: 'Leave fullscreen'
});

export const enterFullscreenLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.enterFullscreen',
	defaultMessage: 'Enter fullscreen'
});

export const EnterFullscreenMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.enterFullscreen' defaultMessage='Enter fullscreen' />;	

export const unlockRoomLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.unLockRoom',
	defaultMessage: 'Unlock room'
});

export const UnlockMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.unLockRoom' defaultMessage='Unlock room' />;

export const lockRoomLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'tooltip.lockRoom',
	defaultMessage: 'Lock room'
});

export const LockMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.lockRoom' defaultMessage='Lock room' />;