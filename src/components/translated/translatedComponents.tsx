import { ReactNode } from 'react';
import { intl } from '../../utils/intlManager';

export const noLabel = (): string => intl.formatMessage({
	id: 'label.no',
	defaultMessage: 'No'
});

export const yesLabel = (): string => intl.formatMessage({
	id: 'label.yes',
	defaultMessage: 'Yes'
});

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

export const chatScrollToBottomLabel = (): string => intl.formatMessage({
	id: 'label.chatScrollToBottom',
	defaultMessage: 'Scroll to bottom'
});

export const shareLabel = (): string => intl.formatMessage({
	id: 'label.shareFile',
	defaultMessage: 'Share'
});

export const extraVideoLabel = (): string => intl.formatMessage({
	id: 'room.extraVideo',
	defaultMessage: 'Extra video'
});

export const promotePeersLabel = (): string => intl.formatMessage({
	id: 'label.promoteAllPeers',
	defaultMessage: 'Promote all'
});

export const lobbyAdministrationLabel = (): string => intl.formatMessage({
	id: 'room.lobbyAdministration',
	defaultMessage: 'Lobby administration'
});

export const peersInLobbyLabel = (): string => intl.formatMessage({
	id: 'room.peersInLobby',
	defaultMessage: 'Participants in lobby'
});

export const promoteFromLobbyLabel = (): string => intl.formatMessage({
	id: 'tooltip.admitFromLobby',
	defaultMessage: 'Click to let them in'
});

export const roomLockedLabel = (): string => intl.formatMessage({
	id: 'room.lockedWait',
	defaultMessage: 'The room is locked - hang on until somebody lets you in ...'
});

export const confirmLeaveLabel = (): string => intl.formatMessage({
	id: 'room.leaveConfirmationMessage',
	defaultMessage: 'Do you want to leave the room?'
});

export const leaveRoomLabel = (): string => intl.formatMessage({
	id: 'room.leavingTheRoom',
	defaultMessage: 'Leaving the room'
});

export const showSelfViewLabel = (): string => intl.formatMessage({
	id: 'room.showSelfView',
	defaultMessage: 'Show self view video'
});

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

export const addVideoLabel = (): string => intl.formatMessage({
	id: 'label.addVideo',
	defaultMessage: 'Add video'
});

export const showLobbyLabel = (): string => intl.formatMessage({
	id: 'tooltip.lobby',
	defaultMessage: 'Show lobby'
});

export const leaveLabel = (): string => intl.formatMessage({
	id: 'label.leave',
	defaultMessage: 'Leave'
});

export const helpLabel = (): string => intl.formatMessage({
	id: 'room.help',
	defaultMessage: 'Help'
});

export const aboutLabel = (): string => intl.formatMessage({
	id: 'room.about',
	defaultMessage: 'About'
});

export const loginLabel = (): string => intl.formatMessage({
	id: 'tooltip.login',
	defaultMessage: 'Log in'
});

export const logoutLabel = (): string => intl.formatMessage({
	id: 'tooltip.logout',
	defaultMessage: 'Log out'
});

export const joinLabel = (): string => intl.formatMessage({
	id: 'label.join',
	defaultMessage: 'Join'
});

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

export const showSettingsLabel = (): string => intl.formatMessage({
	id: 'tooltip.settings',
	defaultMessage: 'Show settings'
});

export const leaveFullscreenLabel = (): string => intl.formatMessage({
	id: 'tooltip.leaveFullscreen',
	defaultMessage: 'Leave fullscreen'
});

export const enterFullscreenLabel = (): string => intl.formatMessage({
	id: 'tooltip.enterFullscreen',
	defaultMessage: 'Enter fullscreen'
});

export const newWindowLabel = (): string => intl.formatMessage({
	id: 'label.newWindow',
	defaultMessage: 'New window'
});

export const unlockRoomLabel = (): string => intl.formatMessage({
	id: 'tooltip.unLockRoom',
	defaultMessage: 'Unlock room'
});

export const lockRoomLabel = (): string => intl.formatMessage({
	id: 'tooltip.lockRoom',
	defaultMessage: 'Lock room'
});

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

export const stopAllVideoLabel = (): string => intl.formatMessage({
	id: 'room.stopAllVideo',
	defaultMessage: 'Stop all video'
});

export const stopAllScreensharingLabel = (): string => intl.formatMessage({
	id: 'room.stopAllScreenSharing',
	defaultMessage: 'Stop all screensharing'
});

export const closeMeetingLabel = (): string => intl.formatMessage({
	id: 'room.closeMeeting',
	defaultMessage: 'Close meeting for all'
});

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

export const startExtraVideoLabel = (): string => intl.formatMessage({
	id: 'label.addVideo',
	defaultMessage: 'Add video'
});

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

export const shareScreenLabel = (): string => intl.formatMessage({
	id: 'device.shareScreen',
	defaultMessage: 'Share screen'
});

export const startRecordingLabel = (): string => intl.formatMessage({
	id: 'tooltip.startLocalRecording',
	defaultMessage: 'Start local recording'
});

export const stopRecordingLabel = (): string => intl.formatMessage({
	id: 'tooltip.stopLocalRecording',
	defaultMessage: 'Stop local recording'
});

export const meLabel = (): string => intl.formatMessage({
	id: 'room.me',
	defaultMessage: 'Me'
});

export const participantsLabel = (): string => intl.formatMessage({
	id: 'label.participants',
	defaultMessage: 'Participants'
});

export const filesharingLabel = (): string => intl.formatMessage({
	id: 'filesharing.filesharing',
	defaultMessage: 'Filesharing'
});

export const noFilesLabel = (): string => intl.formatMessage({
	id: 'filesharing.noFiles',
	defaultMessage: 'No files'
});

export const shareFileLabel = (): string => intl.formatMessage({
	id: 'label.shareFile',
	defaultMessage: 'Share file'
});

export const startingFileSharingLabel = (): string => intl.formatMessage({
	id: 'filesharing.startingFileShare',
	defaultMessage: 'Attempting to share file'
});

export const downloadFileLabel = (): string => intl.formatMessage({
	id: 'filesharing.download',
	defaultMessage: 'Download'
});

export const saveFileLabel = (): string => intl.formatMessage({
	id: 'filesharing.save',
	defaultMessage: 'Save'
});

export const saveFileErrorLabel = (): string => intl.formatMessage({
	id: 'filesharing.saveFileError',
	defaultMessage: 'Error saving file'
});

export const downloadFileErrorLabel = (): string => intl.formatMessage({
	id: 'filesharing.downloadError',
	defaultMessage: 'Download failed'
});

export const filesharingUnsupportedLabel = (): string =>
	intl.formatMessage({
		id: 'label.fileSharingUnsupported',
		defaultMessage: 'File sharing not supported'
	});

export const chatLabel = (): string => intl.formatMessage({
	id: 'label.chat',
	defaultMessage: 'Chat'
});

export const disableAllMediaLabel = (): string => intl.formatMessage({
	id: 'devices.disableBothMicrophoneAndCamera',
	defaultMessage: 'Disable both Microphone And Camera'
});

export const enableCameraLabel = (): string => intl.formatMessage({
	id: 'devices.enableOnlyCamera',
	defaultMessage: 'Enable only Camera'
});

export const enableMicrophoneLabel = (): string => intl.formatMessage({
	id: 'devices.enableOnlyMicrophone',
	defaultMessage: 'Enable only Microphone'
});

export const enableAllMediaLabel = (): string => intl.formatMessage({
	id: 'devices.enableBothMicrophoneAndCamera',
	defaultMessage: 'Enable both Microphone And Camera'
});

export const devicesChangedLabel = (): string => intl.formatMessage({
	id: 'devices.devicesChanged',
	defaultMessage: 'Your devices changed, configure your devices in the settings dialog'
});

export const selectLanguageLabel = (): string => intl.formatMessage({
	id: 'settings.language',
	defaultMessage: 'Select language'
});

export const moderatorActionsLabel = (): string => intl.formatMessage({
	id: 'room.moderatoractions',
	defaultMessage: 'Moderator actions'
});

export const clearChatLabel = (): string => intl.formatMessage({
	id: 'room.clearChat',
	defaultMessage: 'Clear chat'
});

export const clearFilesLabel = (): string => intl.formatMessage({
	id: 'room.clearFiles',
	defaultMessage: 'Clear files'
});

export const settingsLabel = (): string => intl.formatMessage({
	id: 'settings.settings',
	defaultMessage: 'Settings'
});

export const closeLabel = (): string => intl.formatMessage({
	id: 'label.close',
	defaultMessage: 'Close'
});

export const applyLabel = (): string => intl.formatMessage({
	id: 'label.apply',
	defaultMessage: 'Apply'
});

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

export const muteParticipantVideoLabel = (): string => intl.formatMessage({
	id: 'tooltip.muteParticipantVideo',
	defaultMessage: 'Mute video'
});

export const unMuteParticipantVideoLabel = (): string => intl.formatMessage({
	id: 'tooltip.unMuteParticipantVideo',
	defaultMessage: 'Unmute video'
});

export const mutedPTTLabel = (): ReactNode => intl.formatMessage({
	id: 'me.mutedPTT',
	defaultMessage: 'You are muted{br}hold down SPACE-BAR to talk'
}, { br: <br /> });