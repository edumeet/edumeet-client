import { FormattedMessage, IntlShape } from 'react-intl';

export const yourNameLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.yourName',
	defaultMessage: 'Your name'
});

export const roomNameLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.roomName',
	defaultMessage: 'Room name'
});

export const chatInputLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.chatInput',
	defaultMessage: 'Enter chat message...'
});

export const ChatScrollToBottomMessage = (): JSX.Element =>
	<FormattedMessage id='label.chatScrollToBottom' defaultMessage='Scroll to bottom' />;

export const shareLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.share',
	defaultMessage: 'Share'
});

export const ExtraVideoMessage = (): JSX.Element =>
	<FormattedMessage id='room.extraVideo' defaultMessage='Extra video' />;

export const PromotePeersMessage = (): JSX.Element =>
	<FormattedMessage id='label.promoteAllPeers' defaultMessage='Promote all' />;

export const LobbyAdministrationMessage = (): JSX.Element =>
	<FormattedMessage id='room.lobbyAdministration' defaultMessage='Lobby administration' />;

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

export const mirroredSelfViewLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.mirrorOwnVideo',
	defaultMessage: 'Mirrored self view video'
});

export const hideNoVideoParticipantsLabel =
	(intl: IntlShape): string => intl.formatMessage({
		id: 'settings.hideNoVideoParticipants',
		defaultMessage: 'Hide participants with no video'
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

export const newWindowLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.newWindow',
	defaultMessage: 'New window'
});

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

export const audioUnsupportedLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.audioUnsupported',
	defaultMessage: 'Audio unsupported'
});

export const activateAudioLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.activateAudio',
	defaultMessage: 'Activate audio'
});

export const muteAudioLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.muteAudio',
	defaultMessage: 'Mute audio'
});

export const unmuteAudioLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.unMuteAudio',
	defaultMessage: 'Unmute audio'
});

export const videoUnsupportedLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.videoUnsupported',
	defaultMessage: 'Video unsupported'
});

export const stopVideoLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.stopVideo',
	defaultMessage: 'Stop video'
});

export const startVideoLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.startVideo',
	defaultMessage: 'Start video'
});

export const screenSharingUnsupportedLabel = (intl: IntlShape): string =>
	intl.formatMessage({
		id: 'device.screenSharingUnsupported',
		defaultMessage: 'Screen sharing not supported'
	});

export const stopScreenSharingLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.stopScreenSharing',
	defaultMessage: 'Stop screen sharing'
});

export const startScreenSharingLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'device.startScreenSharing',
	defaultMessage: 'Start screen sharing'
});

export const ShareScreenMessage = (): JSX.Element =>
	<FormattedMessage id='device.shareScreen' defaultMessage='Share screen' />;

export const MeMessage = (): JSX.Element =>
	<FormattedMessage id='room.me' defaultMessage='Me' />;

export const ParticipantsMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.participants'
		defaultMessage='Participants'
	/>;

export const participantsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.participants',
	defaultMessage: 'Participants'
});

export const chatLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.chat',
	defaultMessage: 'Chat'
});

export const DisableAllMediaMessage = (): JSX.Element =>
	<FormattedMessage
		id='devices.disableBothMicrophoneAndCamera'
		defaultMessage='Disable both Microphone And Camera'
	/>;

export const EnableCameraMessage = (): JSX.Element =>
	<FormattedMessage
		id='devices.enableOnlyCamera'
		defaultMessage='Enable only Camera'
	/>;

export const EnableMicrophoneMessage = (): JSX.Element =>
	<FormattedMessage
		id='devices.enableOnlyMicrophone'
		defaultMessage='Enable only Microphone'
	/>;

export const EnableAllMediaMessage = (): JSX.Element =>
	<FormattedMessage
		id='devices.enableBothMicrophoneAndCamera'
		defaultMessage='Enable both Microphone And Camera'
	/>;

export const ModeratorActionsMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.moderatoractions'
		defaultMessage='Moderator actions'
	/>;

export const SettingsMessage = (): JSX.Element =>
	<FormattedMessage
		id='settings.settings'
		defaultMessage='Settings'
	/>;

export const CloseMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.close'
		defaultMessage='Close'
	/>;

export const ApplyMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.apply'
		defaultMessage='Apply'
	/>;

export const mediaSettingsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.media',
	defaultMessage: 'Media'
});

export const appearanceSettingsLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'label.appearance',
	defaultMessage: 'Appearance'
});

export const audioDeviceLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.audio',
	defaultMessage: 'Audio input device'
});

export const selectAudioDeviceLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.selectAudio',
	defaultMessage: 'Select audio input device'
});

export const noAudioDevicesLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.cantSelectAudio',
	defaultMessage: 'Unable to select audio input device'
});

export const videoDeviceLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.camera',
	defaultMessage: 'Camera'
});

export const selectVideoDeviceLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.selectCamera',
	defaultMessage: 'Select video device'
});

export const noVideoDevicesLabel = (intl: IntlShape): string => intl.formatMessage({
	id: 'settings.cantSelectCamera',
	defaultMessage: 'Unable to select video device'
});