import { FormattedMessage } from 'react-intl';
import { intl } from '../../utils/intlManager';

export const NoMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.no'
		defaultMessage='No'
	/>;

export const YesMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.yes'
		defaultMessage='Yes'
	/>;

export const joinedRoomLabel = (): string => intl.formatMessage({
	id: 'room.joined',
	defaultMessage: 'You have joined the room'
});

export const peerJoinedRoomLabel = (displayName: string): string => intl.formatMessage({
	id: 'room.newPeer',
	defaultMessage: '{displayName} joined the room'
}, { displayName });

export const yourNameLabel = (): string => intl.formatMessage({
	id: 'label.yourName',
	defaultMessage: 'Your name'
});

export const roomNameLabel = (): string => intl.formatMessage({
	id: 'label.roomName',
	defaultMessage: 'Room name'
});

export const raiseHandLabel = (): string => intl.formatMessage({
	id: 'tooltip.raisedHand',
	defaultMessage: 'Raise hand'
});

export const chatInputLabel = (): string => intl.formatMessage({
	id: 'label.chatInput',
	defaultMessage: 'Enter chat message...'
});

export const ChatScrollToBottomMessage = (): JSX.Element =>
	<FormattedMessage id='label.chatScrollToBottom' defaultMessage='Scroll to bottom' />;

export const shareLabel = (): string => intl.formatMessage({
	id: 'label.shareFile',
	defaultMessage: 'Share'
});

export const ExtraVideoMessage = (): JSX.Element =>
	<FormattedMessage id='room.extraVideo' defaultMessage='Extra video' />;

export const PromotePeersMessage = (): JSX.Element =>
	<FormattedMessage id='label.promoteAllPeers' defaultMessage='Promote all' />;

export const LobbyAdministrationMessage = (): JSX.Element =>
	<FormattedMessage id='room.lobbyAdministration' defaultMessage='Lobby administration' />;

export const PeersInLobbyMessage = (): JSX.Element =>
	<FormattedMessage id='room.peersInLobby' defaultMessage='Participants in lobby' />;

export const promoteFromLobbyLabel = (): string => intl.formatMessage({
	id: 'tooltip.admitFromLobby',
	defaultMessage: 'Click to let them in'
});

export const RoomLockedMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.locketWait'
		defaultMessage='The room is locked - hang on until somebody lets you in ...'
	/>;

export const ConfirmLeaveMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.leaveConfirmationMessage'
		defaultMessage='Do you want to leave the room?'
	/>;

export const LeaveRoomMessage = (): JSX.Element =>
	<FormattedMessage id='room.leavingTheRoom' defaultMessage='Leaving the room' />;

export const ShowSelfViewMessage = (): JSX.Element =>
	<FormattedMessage id='room.showSelfView' defaultMessage='Show self view video' />;

export const showSelfViewLabel = (): string => intl.formatMessage({
	id: 'room.showSelfView',
	defaultMessage: 'Show self view video'
});

export const HideSelfViewMessage = (): JSX.Element =>
	<FormattedMessage id='room.hideSelfView' defaultMessage='Hide self view video' />;

export const hideSelfViewLabel = (): string => intl.formatMessage({
	id: 'room.hideSelfView',
	defaultMessage: 'Hide self view video'
});

export const mirroredSelfViewLabel = (): string => intl.formatMessage({
	id: 'settings.mirrorOwnVideo',
	defaultMessage: 'Mirrored self view video'
});

export const hideNoVideoParticipantsLabel =
	(): string => intl.formatMessage({
		id: 'settings.hideNoVideoParticipants',
		defaultMessage: 'Hide participants with no video'
	});

export const AddVideoMessage = (): JSX.Element =>
	<FormattedMessage id='label.addVideo' defaultMessage='Add video' />;

export const addVideoLabel = (): string => intl.formatMessage({
	id: 'label.addVideo',
	defaultMessage: 'Add video'
});

export const showLobbyLabel = (): string => intl.formatMessage({
	id: 'tooltip.lobby',
	defaultMessage: 'Show lobby'
});

export const LeaveMessage = (): JSX.Element =>
	<FormattedMessage id='label.leave' defaultMessage='Leave' />;

export const leaveLabel = (): string => intl.formatMessage({
	id: 'label.leave',
	defaultMessage: 'Leave'
});

export const HelpMessage = (): JSX.Element =>
	<FormattedMessage id='room.help' defaultMessage='Help' />;

export const helpLabel = (): string => intl.formatMessage({
	id: 'room.help',
	defaultMessage: 'Help'
});

export const AboutMessage = (): JSX.Element =>
	<FormattedMessage id='room.about' defaultMessage='About' />;

export const aboutLabel = (): string => intl.formatMessage({
	id: 'room.about',
	defaultMessage: 'About'
});

export const loginLabel = (): string => intl.formatMessage({
	id: 'tooltip.login',
	defaultMessage: 'Log in'
});

export const LoginMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.login' defaultMessage='Log in' />;

export const logoutLabel = (): string => intl.formatMessage({
	id: 'tooltip.logout',
	defaultMessage: 'Log out'
});

export const LogoutMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.logout' defaultMessage='Log out' />;

export const JoinMessage = (): JSX.Element =>
	<FormattedMessage id='label.join' defaultMessage='Join' />;

export const moreActionsLabel = (): string => intl.formatMessage({
	id: 'label.moreActions',
	defaultMessage: 'More actions'
});

export const openDrawerLabel = (): string => intl.formatMessage({
	id: 'label.openDrawer',
	defaultMessage: 'Open drawer'
});

export const showParticipantsLabel = (): string => intl.formatMessage({
	id: 'tooltip.participants',
	defaultMessage: 'Show participants'
});

export const ShowParticipantsMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.participants' defaultMessage='Show participants' />;

export const showSettingsLabel = (): string => intl.formatMessage({
	id: 'tooltip.settings',
	defaultMessage: 'Show settings'
});

export const ShowSettingsMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.settings' defaultMessage='Show settings' />;

export const leaveFullscreenLabel = (): string => intl.formatMessage({
	id: 'tooltip.leaveFullscreen',
	defaultMessage: 'Leave fullscreen'
});

export const enterFullscreenLabel = (): string => intl.formatMessage({
	id: 'tooltip.enterFullscreen',
	defaultMessage: 'Enter fullscreen'
});

export const EnterFullscreenMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.enterFullscreen' defaultMessage='Enter fullscreen' />;

export const newWindowLabel = (): string => intl.formatMessage({
	id: 'label.newWindow',
	defaultMessage: 'New window'
});

export const unlockRoomLabel = (): string => intl.formatMessage({
	id: 'tooltip.unLockRoom',
	defaultMessage: 'Unlock room'
});

export const UnlockMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.unLockRoom' defaultMessage='Unlock room' />;

export const lockRoomLabel = (): string => intl.formatMessage({
	id: 'tooltip.lockRoom',
	defaultMessage: 'Lock room'
});

export const LockMessage = (): JSX.Element =>
	<FormattedMessage id='tooltip.lockRoom' defaultMessage='Lock room' />;

export const audioUnsupportedLabel = (): string => intl.formatMessage({
	id: 'device.audioUnsupported',
	defaultMessage: 'Audio unsupported'
});

export const activateAudioLabel = (): string => intl.formatMessage({
	id: 'device.activateAudio',
	defaultMessage: 'Activate audio'
});

export const muteAllLabel = (): string => intl.formatMessage({
	id: 'room.muteAll',
	defaultMessage: 'Mute all'
});

export const MuteAllMessage = (): JSX.Element =>
	<FormattedMessage id='room.muteAll' defaultMessage='Mute all' />;

export const stopAllVideoLabel = (): string => intl.formatMessage({
	id: 'room.stopAllVideo',
	defaultMessage: 'Stop all video'
});

export const StopAllVideoMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.stopAllVideo'
		defaultMessage='Stop all video'
	/>;

export const stopAllScreensharingLabel = (): string => intl.formatMessage({
	id: 'room.stopAllScreenSharing',
	defaultMessage: 'Stop all screensharing'
});

export const StopAllScreenSharingMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.stopAllScreenSharing'
		defaultMessage='Stop all screensharing'
	/>;

export const closeMeetingLabel = (): string => intl.formatMessage({
	id: 'room.closeMeeting',
	defaultMessage: 'Close meeting for all'
});

export const CloseMeetingMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.closeMeeting'
		defaultMessage='Close meeting for all'
	/>;

export const muteAudioLabel = (): string => intl.formatMessage({
	id: 'device.muteAudio',
	defaultMessage: 'Mute audio'
});

export const unmuteAudioLabel = (): string => intl.formatMessage({
	id: 'device.unMuteAudio',
	defaultMessage: 'Unmute audio'
});

export const videoUnsupportedLabel = (): string => intl.formatMessage({
	id: 'device.videoUnsupported',
	defaultMessage: 'Video unsupported'
});

export const stopVideoLabel = (): string => intl.formatMessage({
	id: 'device.stopVideo',
	defaultMessage: 'Stop video'
});

export const startVideoLabel = (): string => intl.formatMessage({
	id: 'device.startVideo',
	defaultMessage: 'Start video'
});

export const StartExtraVideoMessage = (): JSX.Element =>
	<FormattedMessage id='label.addVideo' defaultMessage='Add video' />;

export const screenSharingUnsupportedLabel = (): string =>
	intl.formatMessage({
		id: 'device.screenSharingUnsupported',
		defaultMessage: 'Screen sharing not supported'
	});

export const stopScreenSharingLabel = (): string => intl.formatMessage({
	id: 'device.stopScreenSharing',
	defaultMessage: 'Stop screen sharing'
});

export const startScreenSharingLabel = (): string => intl.formatMessage({
	id: 'device.startScreenSharing',
	defaultMessage: 'Start screen sharing'
});

export const ShareScreenMessage = (): JSX.Element =>
	<FormattedMessage id='device.shareScreen' defaultMessage='Share screen' />;

export const startRecordingLabel = (): string => intl.formatMessage({
	id: 'tooltip.startLocalRecording',
	defaultMessage: 'Start local recording'
});

export const stopRecordingLabel = (): string => intl.formatMessage({
	id: 'tooltip.stopLocalRecording',
	defaultMessage: 'Stop local recording'
});

export const MeMessage = (): JSX.Element =>
	<FormattedMessage id='room.me' defaultMessage='Me' />;

export const ParticipantsMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.participants'
		defaultMessage='Participants'
	/>;

export const participantsLabel = (): string => intl.formatMessage({
	id: 'label.participants',
	defaultMessage: 'Participants'
});

export const shareFileLabel = (): string => intl.formatMessage({
	id: 'label.shareFile',
	defaultMessage: 'Share file'
});

export const StartingFileSharingMessage = (): JSX.Element =>
	<FormattedMessage
		id='filesharing.startingFileShare'
		defaultMessage='Attempting to share file'
	/>;

export const DownloadFileMessage = (): JSX.Element =>
	<FormattedMessage id='filesharing.download' defaultMessage='Download' />;

export const SaveFileMessage = (): JSX.Element =>
	<FormattedMessage id='filesharing.save' defaultMessage='Save' />;

export const saveFileErrorLabel = (): string => intl.formatMessage({
	id: 'filesharing.saveFileError',
	defaultMessage: 'Error saving file'
});

export const DownloadFileErrorMessage = (): JSX.Element =>
	<FormattedMessage
		id='filesharing.downloadError'
		defaultMessage='Download failed'
	/>;

export const filesharingUnsupportedLabel = (): string =>
	intl.formatMessage({
		id: 'label.fileSharingUnsupported',
		defaultMessage: 'File sharing not supported'
	});

export const chatLabel = (): string => intl.formatMessage({
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

export const devicesChangedLabel = (): string => intl.formatMessage({
	id: 'devices.devicesChanged',
	defaultMessage: 'Your devices changed, configure your devices in the settings dialog'
});

export const selectLanguageLabel = (): string => intl.formatMessage({
	id: 'settings.language',
	defaultMessage: 'Select language'
});

export const ModeratorActionsMessage = (): JSX.Element =>
	<FormattedMessage
		id='room.moderatoractions'
		defaultMessage='Moderator actions'
	/>;

export const ClearChatMessage = (): JSX.Element =>
	<FormattedMessage id='room.clearChat' defaultMessage='Clear chat' />;

export const clearChatLabel = (): string => intl.formatMessage({
	id: 'room.clearChat',
	defaultMessage: 'Clear chat'
});

export const ClearFilesMessage = (): JSX.Element =>
	<FormattedMessage id='room.clearFiles' defaultMessage='Clear files' />;

export const clearFilesLabel = (): string => intl.formatMessage({
	id: 'room.clearFiles',
	defaultMessage: 'Clear files'
});

export const SettingsMessage = (): JSX.Element =>
	<FormattedMessage
		id='settings.settings'
		defaultMessage='Settings'
	/>;

export const FilesharingMessage = (): JSX.Element =>
	<FormattedMessage
		id='label.shareFile'
		defaultMessage='Share file'
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

export const mediaSettingsLabel = (): string => intl.formatMessage({
	id: 'label.media',
	defaultMessage: 'Media'
});

export const appearanceSettingsLabel = (): string => intl.formatMessage({
	id: 'label.appearance',
	defaultMessage: 'Appearance'
});

export const audioDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.audio',
	defaultMessage: 'Audio input device'
});

export const selectAudioDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.selectAudio',
	defaultMessage: 'Select audio input device'
});

export const noAudioDevicesLabel = (): string => intl.formatMessage({
	id: 'settings.cantSelectAudio',
	defaultMessage: 'Unable to select audio input device'
});

export const videoDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.camera',
	defaultMessage: 'Camera'
});

export const selectVideoDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.selectCamera',
	defaultMessage: 'Select video device'
});

export const noVideoDevicesLabel = (): string => intl.formatMessage({
	id: 'settings.cantSelectCamera',
	defaultMessage: 'Unable to select video device'
});

export const MuteParticipantVideoMessage = (): JSX.Element =>
	<FormattedMessage
		id='tooltip.muteParticipantVideo'
		defaultMessage='Mute video'
	/>;

export const UnmuteParticipantVideoMessage = (): JSX.Element =>
	<FormattedMessage
		id='tooltip.unMuteParticipantVideo'
		defaultMessage='Unmute video'
	/>;