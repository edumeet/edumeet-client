import { FormattedMessage, IntlShape } from 'react-intl';

export const ShowSelfViewMessage = () =>
	<FormattedMessage id='room.showSelfView' defaultMessage='Show self view video' />;

export const showSelfViewLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'room.showSelfView',
	defaultMessage: 'Show self view video'
});

export const HideSelfViewMessage = () =>
	<FormattedMessage id='room.hideSelfView' defaultMessage='Hide self view video' />;

export const hideSelfViewLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'room.hideSelfView',
	defaultMessage: 'Hide self view video'
});

export const AddVideoMessage = () =>
	<FormattedMessage id='label.addVideo' defaultMessage='Add video' />;

export const addVideoLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'label.addVideo',
	defaultMessage: 'Add video'
});

export const showLobbyLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.lobby',
	defaultMessage: 'Show lobby'
});

export const LeaveMessage = () =>
	<FormattedMessage id='label.leave' defaultMessage='Leave' />;

export const leaveLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'label.leave',
	defaultMessage: 'Leave'
});

export const HelpMessage = () =>
	<FormattedMessage id='room.help' defaultMessage='Help' />;

export const helpLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'room.help',
	defaultMessage: 'Help'
});

export const AboutMessage = () =>
	<FormattedMessage id='room.about' defaultMessage='About' />;

export const aboutLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'room.about',
	defaultMessage: 'About'
});

export const loginLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.login',
	defaultMessage: 'Log in'
});

export const LoginMessage = () =>
	<FormattedMessage id='tooltip.login' defaultMessage='Log in' />;

export const logoutLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.logout',
	defaultMessage: 'Log out'
});

export const LogoutMessage = () =>
	<FormattedMessage id='tooltip.logout' defaultMessage='Log out' />;

export const moreActionsLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'label.moreActions',
	defaultMessage: 'More actions'
});

export const openDrawerLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'label.openDrawer',
	defaultMessage: 'Open drawer'
});

export const showParticipantsLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.participants',
	defaultMessage: 'Show participants'
});

export const ShowParticipantsMessage = () =>
	<FormattedMessage id='tooltip.participants' defaultMessage='Show participants' />;

export const showSettingsLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.settings',
	defaultMessage: 'Show settings'
});

export const ShowSettingsMessage = () =>
	<FormattedMessage id='tooltip.settings' defaultMessage='Show settings' />;

export const leaveFullscreenLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.leaveFullscreen',
	defaultMessage: 'Leave fullscreen'
});

export const enterFullscreenLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.enterFullscreen',
	defaultMessage: 'Enter fullscreen'
});

export const EnterFullscreenMessage = () =>
	<FormattedMessage id='tooltip.enterFullscreen' defaultMessage='Enter fullscreen' />;	

export const unlockRoomLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.unLockRoom',
	defaultMessage: 'Unlock room'
});

export const UnlockMessage = () =>
	<FormattedMessage id='tooltip.unLockRoom' defaultMessage='Unlock room' />;

export const lockRoomLabel = (intl: IntlShape) => intl.formatMessage({
	id: 'tooltip.lockRoom',
	defaultMessage: 'Lock room'
});

export const LockMessage = () =>
	<FormattedMessage id='tooltip.lockRoom' defaultMessage='Lock room' />;