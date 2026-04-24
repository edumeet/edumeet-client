import { intl } from '../../utils/intlManager';

export const noLabel = (): string => intl.formatMessage({
	id: 'label.no',
	defaultMessage: 'No'
});

export const noneLabel = (): string => intl.formatMessage({
	id: 'label.none',
	defaultMessage: 'None'
});

export const yesLabel = (): string => intl.formatMessage({
	id: 'label.yes',
	defaultMessage: 'Yes'
});

export const defaultLabel = (): string => intl.formatMessage({
	id: 'label.default',
	defaultMessage: 'Default'
});

export const defaultsLabel = (): string => intl.formatMessage({
	id: 'label.defaults',
	defaultMessage: 'Defaults'
});
export const defaultSettingsLabel = (): string => intl.formatMessage({
	id: 'label.defaultSettings',
	defaultMessage: 'Defaults'
});

export const userManagedRoomNumberLimitLabel = (): string => intl.formatMessage({
	id: 'label.defaults.userManagedRoomNumberLimit',
	defaultMessage: 'Number of rooms allowed in the tenant for one user'
});

export const numberLimitLabel = (): string => intl.formatMessage({
	id: 'label.defaults.numberLimit',
	defaultMessage: 'Number of rooms allowed in the tenant'
});

export const managerManagedRoomNumberLimitLabel = (): string => intl.formatMessage({
	id: 'label.defaults.managerManagedRoomNumberLimit',
	defaultMessage: 'Number of rooms allowed in the tenant for one manager user'
});

export const roomBackgroundURLLabel = (): string => intl.formatMessage({
	id: 'label.defaults.roomBackgroundURL',
	defaultMessage: 'Background Image URL'
});
export const roomLogoURLLabel = (): string => intl.formatMessage({
	id: 'label.defaults.roomLogoURL',
	defaultMessage: 'Logo Image URL'
});
export const roomTrackerLabel = (): string => intl.formatMessage({
	id: 'label.defaults.roomTracker',
	defaultMessage: 'Tracker (wss://fqdn/path)'
});
export const defaultRoleIdLabel = (): string => intl.formatMessage({
	id: 'label.defaults.defaultRoleId',
	defaultMessage: 'Default role'
});

export const maxFileSizedLabel = (): string => intl.formatMessage({
	id: 'label.defaults.maxFileSize',
	defaultMessage: 'Max file size'
});

export const typeLablel = (): string => intl.formatMessage({
	id: 'label.type',
	defaultMessage: 'Type'
});
export const parameterLabel = (): string => intl.formatMessage({
	id: 'label.parameter',
	defaultMessage: 'Parameter'
});
export const methodLabel = (): string => intl.formatMessage({
	id: 'label.method',
	defaultMessage: 'Method'
});
export const negateLabel = (): string => intl.formatMessage({
	id: 'label.negate',
	defaultMessage: 'Negate'
});
export const valueLabel = (): string => intl.formatMessage({
	id: 'label.value',
	defaultMessage: 'Value'
});
export const actionLabel = (): string => intl.formatMessage({
	id: 'label.action',
	defaultMessage: 'Action'
});
export const accessIdLabel = (): string => intl.formatMessage({
	id: 'label.accessId',
	defaultMessage: 'Access Id'
});

export const joinedRoomLabel = (): string => intl.formatMessage({
	id: 'room.joined',
	defaultMessage: 'You have joined the room'
});

export const errorJoiningRoomLabel = (): string => intl.formatMessage({
	id: 'room.errorJoiningRoom',
	defaultMessage: 'Error while joining the room'
});

export const peerJoinedRoomLabel = (displayName: string): string => intl.formatMessage({
	id: 'room.newPeer',
	defaultMessage: '{displayName} joined the room'
}, { displayName });

export const peerSentReactionLabel = (displayName: string, reaction: string): string => intl.formatMessage({
	id: 'room.reaction',
	defaultMessage: '{displayName} reacted with {reaction}'
}, { displayName, reaction });

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

export const breakoutRoomsLabel = (): string => intl.formatMessage({
	id: 'label.breakoutRooms',
	defaultMessage: 'Breakout rooms'
});

export const createBreakoutRoomLabel = (): string => intl.formatMessage({
	id: 'label.createBreakoutRoom',
	defaultMessage: 'Create'
});

export const newBreakoutRoomNameLabel = (): string => intl.formatMessage({
	id: 'label.newBreakoutRoomName',
	defaultMessage: 'Breakout room name'
});

export const joinBreakoutRoomLabel = (): string => intl.formatMessage({
	id: 'label.joinBreakoutRoom',
	defaultMessage: 'Join'
});

export const leaveBreakoutRoomLabel = (): string => intl.formatMessage({
	id: 'label.leaveBreakoutRoom',
	defaultMessage: 'Leave'
});

export const clearOutBreakoutRoomLabel = (): string => intl.formatMessage({
	id: 'label.clearOutBreakoutRoom',
	defaultMessage: 'Clear out'
});

export const removeBreakoutRoomLabel = (): string => intl.formatMessage({
	id: 'label.removeBreakoutRoom',
	defaultMessage: 'Remove'
});

export const shareLabel = (): string => intl.formatMessage({
	id: 'label.shareFile',
	defaultMessage: 'Share'
});

export const generalErrorLabel = (): string => intl.formatMessage({
	id: 'room.generalError',
	defaultMessage: 'An error has occurred, please reload the page'
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
	defaultMessage: 'Locked - wait for the host to let you in'
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

export const selectBackgroundLabel = (): string => intl.formatMessage({
	id: 'settings.selectBackground',
	defaultMessage: 'Select background'
});

export const selectVideoBackgroundLabel = (): string => intl.formatMessage({
	id: 'settings.selectVideoBackground',
	defaultMessage: 'Select video background'
});

export const currentlySelectedLabel = (): string => intl.formatMessage({
	id: 'settings.currentlySelected',
	defaultMessage: 'Currently Selected'
});

export const hideNoVideoParticipantsLabel = (): string => intl.formatMessage({
	id: 'settings.hideNoVideoParticipants',
	defaultMessage: 'Hide participants with no video'
});

export const enableBackgroundEffectsOnExtraVideoLabel = (): string => intl.formatMessage({
	id: 'settings.enableBackgroundEffectsOnExtraVideoLabel',
	defaultMessage: 'Enable background effects on extra video'
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

export const shortcutKeysLabel = (): string => intl.formatMessage({
	id: 'room.shortcutKeys',
	defaultMessage: 'Shortcut keys'
});

export const loginLabel = (): string => intl.formatMessage({
	id: 'tooltip.login',
	defaultMessage: 'Log in'
});

export const logoutLabel = (): string => intl.formatMessage({
	id: 'tooltip.logout',
	defaultMessage: 'Log out'
});

export const enterRoomLabel = (): string => intl.formatMessage({
	id: 'label.enterRoom',
	defaultMessage: 'Enter room'
});

export const myRoomsLabel = (): string => intl.formatMessage({
	id: 'label.myRooms',
	defaultMessage: 'My rooms'
});

export const copyRoomLabel = (): string => intl.formatMessage({
	id: 'label.copyRoom',
	defaultMessage: 'Copy meeting link'
});

export const copiedRoomLabel = (): string => intl.formatMessage({
	id: 'label.copiedRoom',
	defaultMessage: 'Copied!'
});

export const joinLabel = (): string => intl.formatMessage({
	id: 'label.join',
	defaultMessage: 'Join'
});

export const moreActionsLabel = (): string => intl.formatMessage({
	id: 'label.moreActions',
	defaultMessage: 'More actions'
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

export const kickLabel = (): string => intl.formatMessage({
	id: 'tooltip.kickParticipant',
	defaultMessage: 'Kick out'
});

export const stopParticipantAudioLabel = (): string => intl.formatMessage({
	id: 'tooltip.muteParticipantAudioModerator',
	defaultMessage: 'Stop audio'
});

export const stopParticipantVideoLabel = (): string => intl.formatMessage({
	id: 'tooltip.muteParticipantVideoModerator',
	defaultMessage: 'Stop video'
});

export const stopParticipantScreenSharingLabel = (): string => intl.formatMessage({
	id: 'tooltip.muteScreenSharingModerator',
	defaultMessage: 'Stop screen share'
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

export const escapeMeetingLabel = (): string => intl.formatMessage({
	id: 'label.escapeMeeting',
	defaultMessage: 'Escape meeting'
});

export const filesharingLabel = (): string => intl.formatMessage({
	id: 'filesharing.filesharing',
	defaultMessage: 'Filesharing'
});

export const filesharingTooBigLabel = (): string => intl.formatMessage({
	id: 'filesharing.filesharingTooBig',
	defaultMessage: 'Filesize is too big!'
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

export const uploadFileLabel = (): string => intl.formatMessage({
	id: 'filesharing.upload',
	defaultMessage: 'Upload file'
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

export const startTranscribingLabel = (): string => intl.formatMessage({
	id: 'tooltip.startTranscribing',
	defaultMessage: 'Start transcribing'
});

export const stopTranscribingLabel = (): string => intl.formatMessage({
	id: 'tooltip.stopTranscribing',
	defaultMessage: 'Stop transcribing'
});

export const chatLabel = (): string => intl.formatMessage({
	id: 'label.chat',
	defaultMessage: 'Chat'
});

export const showChatLabel = (): string => intl.formatMessage({
	id: 'label.showChat',
	defaultMessage: 'Open chat'
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

export const openSettingsLabel = (): string => intl.formatMessage({
	id: 'label.openSettings',
	defaultMessage: 'Open settings'
});

export const closeLabel = (): string => intl.formatMessage({
	id: 'label.close',
	defaultMessage: 'Close'
});

export const applyLabel = (): string => intl.formatMessage({
	id: 'label.apply',
	defaultMessage: 'Apply'
});

export const removeAllImagesLabel = (): string => intl.formatMessage({
	id: 'label.removeAllImages',
	defaultMessage: 'Remove all images'
});

export const roomBgLabel = (): string => intl.formatMessage({
	id: 'label.roomBackground',
	defaultMessage: 'Room background'
});

export const mediaSettingsLabel = (): string => intl.formatMessage({
	id: 'label.media',
	defaultMessage: 'Media'
});

export const appearanceSettingsLabel = (): string => intl.formatMessage({
	id: 'label.appearance',
	defaultMessage: 'Appearance'
});

export const advancedSettingsLabel = (): string => intl.formatMessage({
	id: 'label.advanced',
	defaultMessage: 'Advanced'
});

export const managementSettingsLabel = (): string => intl.formatMessage({
	id: 'label.management',
	defaultMessage: 'Management'
});

export const audioInputDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.audioInput',
	defaultMessage: 'Audio input device'
});

export const audioOutputDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.audioOutput',
	defaultMessage: 'Audio output device'
});

export const testAudioOutputLabel = (): string => intl.formatMessage({
	id: 'settings.testAudioOutput',
	defaultMessage: 'Test Audio output'
});

export const tryToLoadAudioDevices = (): string => intl.formatMessage({
	id: 'settings.tryToLoadAudioDevices',
	defaultMessage: 'Try to load audio devices'
});

export const selectAudioInputDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.selectAudioInput',
	defaultMessage: 'Select audio input device'
});

export const selectAudioOutputDeviceLabel = (): string => intl.formatMessage({
	id: 'settings.selectAudioOutput',
	defaultMessage: 'Select audio output device'
});

export const noAudioInputDevicesLabel = (): string => intl.formatMessage({
	id: 'settings.cantSelectAudioInput',
	defaultMessage: 'Unable to select audio input device'
});

export const noAudioOutputDevicesLabel = (): string => intl.formatMessage({
	id: 'settings.cantSelectAudioOutput',
	defaultMessage: 'Unable to select audio output device'
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

export const mutedPTTLabel = (): string => intl.formatMessage({
	id: 'me.mutedPTT',
	defaultMessage: 'You are muted, hold down SPACE-BAR to talk'
});

export const usePTTLabel = (): string => intl.formatMessage({
	id: 'label.usePTT',
	defaultMessage: 'Use Push-to-Talk'
});

export const audioSettingsLabel = (): string => intl.formatMessage({
	id: 'label.audioSettings',
	defaultMessage: 'Audio settings'
});

export const selectAudioPresetLabel = (): string => intl.formatMessage({
	id: 'settings.audioPreset',
	defaultMessage: 'Select the audio preset'
});

export const advancedAudioSettingsLabel = (): string => intl.formatMessage({
	id: 'settings.showAdvancedAudio',
	defaultMessage: 'Advanced audio settings'
});

export const echoCancellationLabel = (): string => intl.formatMessage({
	id: 'settings.echoCancellation',
	defaultMessage: 'Echo cancellation'
});

export const autoGainControlLabel = (): string => intl.formatMessage({
	id: 'settings.autoGainControl',
	defaultMessage: 'Auto gain control'
});

export const noiseSuppressionLabel = (): string => intl.formatMessage({
	id: 'settings.noiseSuppression',
	defaultMessage: 'Noise suppression'
});

export const selectAudioSampleRateLabel = (): string => intl.formatMessage({
	id: 'settings.sampleRate',
	defaultMessage: 'Select the audio sample rate'
});

export const selectAudioChannelCountLabel = (): string => intl.formatMessage({
	id: 'settings.channelCount',
	defaultMessage: 'Select the audio channel count'
});

export const selectAudioSampleSizeLabel = (): string => intl.formatMessage({
	id: 'settings.sampleSize',
	defaultMessage: 'Select the audio sample size'
});

export const enableOpusDtxLabel = (): string => intl.formatMessage({
	id: 'settings.opusDtx',
	defaultMessage: 'Enable Opus Discontinuous Transmission (DTX)'
});

export const enableOpusFecLabel = (): string => intl.formatMessage({
	id: 'settings.opusFec',
	defaultMessage: 'Enable Opus Forward Error Correction (FEC)'
});

export const selectOpusPtimeLabel = (): string => intl.formatMessage({
	id: 'settings.opusPtime',
	defaultMessage: 'Select the Opus frame size'
});

export const setLastNLabel = (): string => intl.formatMessage({
	id: 'settings.lastN',
	defaultMessage: 'Visible participants'
});

export const backgroundBlurLabel = (): string => intl.formatMessage({
	id: 'settings.backgroundBlur',
	defaultMessage: 'Background blur'
});

export const videoContainLabel = (): string => intl.formatMessage({
	id: 'settings.containVideo',
	defaultMessage: 'Uncrop my video'
});

export const videoSettingsLabel = (): string => intl.formatMessage({
	id: 'label.videoSettings',
	defaultMessage: 'Video settings'
});

export const advancedVideoSettingsLabel = (): string => intl.formatMessage({
	id: 'settings.showAdvancedVideo',
	defaultMessage: 'Advanced video settings'
});

export const selectResolutionLabel = (): string => intl.formatMessage({
	id: 'settings.resolution',
	defaultMessage: 'Select your video resolution'
});

export const lowResolutionLabel = (): string => intl.formatMessage({
	id: 'label.low',
	defaultMessage: 'Low'
});

export const mediumResolutionLabel = (): string => intl.formatMessage({
	id: 'label.medium',
	defaultMessage: 'Medium'
});

export const highResolutionLabel = (): string => intl.formatMessage({
	id: 'label.high',
	defaultMessage: 'High (HD)'
});

export const veryHighResolutionLabel = (): string => intl.formatMessage({
	id: 'label.veryHigh',
	defaultMessage: 'Very high (FHD)'
});

export const ultraResolutionLabel = (): string => intl.formatMessage({
	id: 'label.ultra',
	defaultMessage: 'Ultra (UHD)'
});

export const selectWebcamFrameRateLabel = (): string => intl.formatMessage({
	id: 'settings.webcamFrameRate',
	defaultMessage: 'Select your webcam frame rate'
});

export const selectScreenSharingFrameRateLabel = (): string => intl.formatMessage({
	id: 'settings.screenSharingFrameRate',
	defaultMessage: 'Select your screen sharing frame rate'
});

export const selectRecordingsPreferredMimeTypeLabel = (): string => intl.formatMessage({
	id: 'settings.recordingsPreferredMimeType',
	defaultMessage: 'Select your preferred video mime type'
});

export const showStatsLabel = (): string => intl.formatMessage({
	id: 'label.showStats',
	defaultMessage: 'Show stats'
});

export const enableNotificationSoundsLabel = (): string => intl.formatMessage({
	id: 'settings.notificationSounds',
	defaultMessage: 'Notification sounds'
});

export const enableVerticallyStackedSidePanels = (): string => intl.formatMessage({
	id: 'settings.verticallyStackedSidePanels',
	defaultMessage: 'Vertically stacked side panels'
});

export const enableConfirmOnExit = (): string => intl.formatMessage({
	id: 'settings.confirmOnExit',
	defaultMessage: 'Confirm on exit'
});

export const enableBlurBackground = (): string => intl.formatMessage({
	id: 'settings.enableBlurBackground',
	defaultMessage: 'Enable blur background effect'
});

export const blurBackgroundNotSupported = (): string => intl.formatMessage({
	id: 'settings.blurBackgroundNotSupported',
	defaultMessage: 'Blur background effect not supported'
});

export const mgmtSvcUnavailable = (): string => intl.formatMessage({
	id: 'svc.mgmtUnavailable',
	defaultMessage: 'Management service: Unavailable'
});

export const mediaNodeSvcUnavailable = (): string => intl.formatMessage({
	id: 'svc.mediaNodeUnavailable',
	defaultMessage: 'Media-node service: Unavailable'
});

export const mediaNodeConnectionError = (): string => intl.formatMessage({
	id: 'svc.mediaConnectionNodeError',
	defaultMessage: 'Media-node service: Connection error'
});

export const mediaNodeConnectionSuccess = (): string => intl.formatMessage({
	id: 'svc.mediaConnectionNodeSuccess',
	defaultMessage: 'Media-Node service: Got connection'
});

export const roomServerConnectionError = (message: string): string => intl.formatMessage({
	id: 'svc.roomServerConnectionError',
	defaultMessage: `Room-server: ${message}`
});

export const tenantSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementTenantSettings',
	defaultMessage: 'Tenant settings'
});
export const roomSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementRoomSettings',
	defaultMessage: 'Room settings'
});
export const userSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementUserSettings',
	defaultMessage: 'User settings'
});
export const groupSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementGroupSettings',
	defaultMessage: 'Group settings'
});
export const roleSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementRoleSettings',
	defaultMessage: 'Role settings'
});
export const ruleSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementRuleSettings',
	defaultMessage: 'Rule settings'
});
export const imprintLabel = (): string => intl.formatMessage({
	id: 'label.imprint',
	defaultMessage: 'Impressum'
});
export const privacyLabel = (): string => intl.formatMessage({
	id: 'label.privacy',
	defaultMessage: 'Privacy'
});
export const joinConsentLabel = (): string => intl.formatMessage({
	id: 'label.joinConsent',
	defaultMessage: 'By joining, you accept our'
});
export const privacyPolicyLabel = (): string => intl.formatMessage({
	id: 'label.privacyPolicy',
	defaultMessage: 'Privacy Policy'
});
export const countdownTimerTitleLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.title',
	defaultMessage: 'Countdown timer'
});

export const countdownTimerStartLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.start',
	defaultMessage: 'Start'
});

export const countdownTimerStopLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.stop',
	defaultMessage: 'Stop'
});

export const countdownTimerEnableLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.enable',
	defaultMessage: 'Enable'
});

export const countdownTimerDisableLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.disable',
	defaultMessage: 'Disable'
});

export const countdownTimerSetLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.set',
	defaultMessage: 'Set'
});
export const countdownTimerFinishedLabel = (): string => intl.formatMessage({
	id: 'label.countdownTimer.finished',
	defaultMessage: 'Time is up!'
});

export const startDrawingLabel = (): string => intl.formatMessage({
	id: 'room.startDrawing',
	defaultMessage: 'Start drawing'
});

export const stopDrawingLabel = (): string => intl.formatMessage({
	id: 'room.stopDrawing',
	defaultMessage: 'Stop drawing'
});

export const removeDrawingLabels = (): string => intl.formatMessage({
	id: 'room.removeDrawings',
	defaultMessage: 'Remove drawings for all'
});

export const drawingRemovedLabel = (): string => intl.formatMessage({
	id: 'room.drawingsRemoved',
	defaultMessage: 'The drawings have been removed'
});

export const startDrawingModeLabel = (): string => intl.formatMessage({
	id: 'room.startDrawingMode',
	defaultMessage: 'The drawing mode has been started'
});

export const stopDrawingModeLabel = (): string => intl.formatMessage({
	id: 'room.stopDrawingMode',
	defaultMessage: 'The drawing mode has been stopped'
});

export const managementRoomSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementRoomSettingsLabel',
	defaultMessage: 'Room settings'
});
export const managementAdvancedSettingsLabel = (): string => intl.formatMessage({
	id: 'label.managementAdvancedSettingsLabel',
	defaultMessage: 'Advanced management settings'
});
export const claimRoomLabel = (): string => intl.formatMessage({
	id: 'label.managementClaimRoomLabel',
	defaultMessage: 'Claim current room'
});
export const editRoomLabel = (): string => intl.formatMessage({
	id: 'label.managementEditRoomLabel',
	defaultMessage: 'Edit current room'
});
export const tenantsLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants',
	defaultMessage: 'Tenants'
});
export const tenantLabel = (): string => intl.formatMessage({
	id: 'label.management.tenant',
	defaultMessage: 'Tenant'
});
export const roomsLabel = (): string => intl.formatMessage({
	id: 'label.management.rooms',
	defaultMessage: 'Rooms'
});
export const roomLabel = (): string => intl.formatMessage({
	id: 'label.management.room',
	defaultMessage: 'Room'
});
export const usersLabel = (): string => intl.formatMessage({
	id: 'label.management.users',
	defaultMessage: 'Users'
});
export const userLabel = (): string => intl.formatMessage({
	id: 'label.management.user',
	defaultMessage: 'User'
});
export const groupsLabel = (): string => intl.formatMessage({
	id: 'label.management.groups',
	defaultMessage: 'Groups'
});
export const groupLabel = (): string => intl.formatMessage({
	id: 'label.management.group',
	defaultMessage: 'Group'
});
export const groupRolesLabel = (): string => intl.formatMessage({
	id: 'label.management.groupRole',
	defaultMessage: 'Group roles'
});
export const groupUsersLabel = (): string => intl.formatMessage({
	id: 'label.management.groupUser',
	defaultMessage: 'User groups'
});
export const rolesLabel = (): string => intl.formatMessage({
	id: 'label.management.roles',
	defaultMessage: 'Roles'
});
export const roleLabel = (): string => intl.formatMessage({
	id: 'label.management.role',
	defaultMessage: 'Role'
});
export const defaultRoleLabel = (): string => intl.formatMessage({
	id: 'label.management.defaultRole',
	defaultMessage: 'Default Role'
});
export const rulesLabel = (): string => intl.formatMessage({
	id: 'label.management.rules',
	defaultMessage: 'Rules'
});
export const chooseComponentLabel = (): string => intl.formatMessage({
	id: 'label.management.chooseComponent',
	defaultMessage: 'Select an item to load a component'
});
export const edumeetManagementClientLabel = (): string => intl.formatMessage({
	id: 'label.management.edumeetManagementClient',
	defaultMessage: 'eduMEET Management client'
});
export const tenantOwnersLabel = (): string => intl.formatMessage({
	id: 'label.management.tenantOwners',
	defaultMessage: 'Tenant owners'
});
export const tenantOwnerLabel = (): string => intl.formatMessage({
	id: 'label.management.tenantOwner',
	defaultMessage: 'Tenant owner'
});
export const tenantAdminsLabel = (): string => intl.formatMessage({
	id: 'label.management.tenantAdmins',
	defaultMessage: 'Tenant admins'
});
export const tenantAdminLabel = (): string => intl.formatMessage({
	id: 'label.management.tenantAdmin',
	defaultMessage: 'Tenant admin'
});
export const addNewLabel = (): string => intl.formatMessage({
	id: 'label.management.addNew',
	defaultMessage: 'Add item'
});
export const manageItemLabel = (): string => intl.formatMessage({
	id: 'label.management.manageItem',
	defaultMessage: 'Manage item'
});
export const genericItemDescLabel = (): string => intl.formatMessage({
	id: 'label.management.genericItemDesc',
	defaultMessage: 'These are the parameters that you can change.'
});
export const deleteLabel = (): string => intl.formatMessage({
	id: 'label.delete',
	defaultMessage: 'Delete'
});
export const cancelLabel = (): string => intl.formatMessage({
	id: 'label.cancel',
	defaultMessage: 'Cancel'
});
export const undefinedLabel = (): string => intl.formatMessage({
	id: 'label.undefined',
	defaultMessage: 'Undefined'
});
export const authenticationLabel = (): string => intl.formatMessage({
	id: 'label.management.tenant.auth',
	defaultMessage: 'Authentication'
});
export const fqdnLabel = (): string => intl.formatMessage({
	id: 'label.management.tenant.fqdn',
	defaultMessage: 'FQDN'
});
export const nameLabel = (): string => intl.formatMessage({
	id: 'label.management.name',
	defaultMessage: 'Name'
});
export const descLabel = (): string => intl.formatMessage({
	id: 'label.management.desc',
	defaultMessage: 'Description'
});
export const logoLabel = (): string => intl.formatMessage({
	id: 'label.management.room.logo',
	defaultMessage: 'Logo'
});
export const maxActiveVideosLabel = (): string => intl.formatMessage({
	id: 'label.management.room.maxActiveVideos',
	defaultMessage: 'Maximum active videos'
});
export const chatEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.chatEnabled',
	defaultMessage: 'Enable chat'
});
export const raiseHandEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.raiseHandEnabled',
	defaultMessage: 'Enable raise hand'
});
export const reactionsEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.reactionsEnabled',
	defaultMessage: 'Enable reactions'
});
export const filesharingEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.filesharingEnabled',
	defaultMessage: 'Enabled filesharing'
});
export const localRecordingEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.localRecordingEnabled',
	defaultMessage: 'Enable local recording'
});
export const breakoutsEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.room.breakoutsEnabled',
	defaultMessage: 'Enable breakout rooms'
});
export const ownersLabel = (): string => intl.formatMessage({
	id: 'label.management.room.owners',
	defaultMessage: 'Owners'

});

export const createdAtLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.createdAt',
	defaultMessage: 'Created at'
});
export const updatedAtLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.updatedAt',
	defaultMessage: 'Updated at'
});
export const creatorIdLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.creatorId',
	defaultMessage: 'Creator id'
});
export const allPermissionsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.allPermissions',
	defaultMessage: 'All permissions'
});
export const undefinedTenantLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.undefinedTenant',
	defaultMessage: 'undefined tenant'
});
export const assertLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.assert',
	defaultMessage: 'Assert'
});
export const gainLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.gain',
	defaultMessage: 'Gain'
});
export const containsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.contains',
	defaultMessage: 'contains'
});
export const equalsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.equals',
	defaultMessage: 'equals'
});
export const startswithLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.startswith',
	defaultMessage: 'startswith'
});
export const endswithLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.endswith',
	defaultMessage: 'endswith'
});
export const actionToRunLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.actionToRun',
	defaultMessage: 'Action to run when condition is satisfied'
});
export const makeUserGroupMemberLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.makeUserGroupMember',
	defaultMessage: 'Make user group member'
});
export const makeUserTenantOwnerLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.makeUserTenantOwner',
	defaultMessage: 'Make user tenant owner'
});
export const makeUserTenantAdminLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.makeUserTenantAdmin',
	defaultMessage: 'Make user tenant admin'
});
export const makeUserSuperAdminLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.makeUserSuperAdmin',
	defaultMessage: 'Make user super admin'
});
export const roomOptionStateLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.roomOptionState',
	defaultMessage: 'Room option state'
});
export const unmanagedLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.unmanaged',
	defaultMessage: '(unmanaged)'
});
export const configurationLockLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.configurationLock',
	defaultMessage: 'Configuration Lock'
});
export const disableUnmanagedRoomsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.disableUnmanagedRooms',
	defaultMessage: 'Disable unmanaged rooms'
});
export const roomLockedMgmtLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.roomLocked',
	defaultMessage: 'Room locked'
});
export const raiseHandMgmtLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.raiseHand',
	defaultMessage: 'Raise Hand'
});
export const localRecordingMgmtLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.localRecording',
	defaultMessage: 'Local Recording'
});
export const chatServiceLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.chatService',
	defaultMessage: 'Chat service'
});
export const breakoutRoomsServiceLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.breakoutRoomsService',
	defaultMessage: 'Breakout rooms service'
});
export const filesharingServiceLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.filesharingService',
	defaultMessage: 'Filesharing service'
});
export const trackerHelperTextLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.trackerHelperText',
	defaultMessage: 'If not set, the server configuration will be used'
});
export const ssoIdLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.ssoId',
	defaultMessage: 'ssoId'
});
export const emailHeaderLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.emailHeader',
	defaultMessage: 'email'
});
export const hiddenEmailLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.hiddenEmail',
	defaultMessage: 'Hidden email'
});
export const hiddenNameLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.hiddenName',
	defaultMessage: 'Hidden name'
});
export const avatarLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.avatar',
	defaultMessage: 'avatar'
});
export const emailFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.emailField',
	defaultMessage: 'Email'
});
export const nameFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.nameField',
	defaultMessage: 'Name'
});
export const tenantAdminFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.tenantAdminField',
	defaultMessage: 'tenantAdmin'
});
export const tenantOwnerFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.tenantOwnerField',
	defaultMessage: 'tenantOwner'
});
export const liveNumberLimitLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.liveNumberLimit',
	defaultMessage: 'liveNumberLimit'
});
export const nameCannotBeEmptyLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.nameCannotBeEmpty',
	defaultMessage: 'Name cannot be empty!'
});
export const permissionsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.permissions',
	defaultMessage: 'Permission(s)'
});
export const fqdnFullLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.fqdnFull',
	defaultMessage: 'Fully Qualified Domain Name (FQDN)'
});
export const fqdnFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.fqdn',
	defaultMessage: 'fqdn'
});
export const accessUrlLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.accessUrl',
	defaultMessage: 'Access URL'
});
export const authorizeUrlLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.authorizeUrl',
	defaultMessage: 'Authorize URL'
});
export const profileUrlLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.profileUrl',
	defaultMessage: 'Profile URL'
});
export const redirectUriLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.redirectUri',
	defaultMessage: 'Redirect URI'
});
export const scopeLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.scope',
	defaultMessage: 'Scope'
});
export const scopeDelimiterLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.scopeDelimiter',
	defaultMessage: 'Scope delimiter'
});
export const endSessionEndpointLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.endSessionEndpoint',
	defaultMessage: 'end_session_endpoint (full logout)'
});
export const nameParameterLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.nameParameter',
	defaultMessage: 'Name parameter (name/nickname/...)'
});
export const wellKnownUrlLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.wellKnownUrl',
	defaultMessage: 'Well-known URL'
});
export const updateParamsFromUrlLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.updateParamsFromUrl',
	defaultMessage: 'Update parameters from URL'
});
export const oauthKeyLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.oauthKey',
	defaultMessage: 'key'
});
export const oauthSecretLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.oauthSecret',
	defaultMessage: 'secret'
});
export const accessUrlFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.accessUrlField',
	defaultMessage: 'access_url'
});
export const authorizeUrlFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.authorizeUrlField',
	defaultMessage: 'authorize_url'
});
export const profileUrlFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.profileUrlField',
	defaultMessage: 'profile_url'
});
export const scopeFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.scopeField',
	defaultMessage: 'scope'
});
export const scopeDelimiterFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.scopeDelimiterField',
	defaultMessage: 'scope_delimiter'
});
export const redirectUrlFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.redirectUrlField',
	defaultMessage: 'redirect_url'
});
export const endSessionEndpointFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.endSessionEndpointField',
	defaultMessage: 'end_session_endpoint'
});
export const nameParameterFieldLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.nameParameterField',
	defaultMessage: 'name_parameter'
});
export const useEditToolLabel = (): string => intl.formatMessage({
	id: 'label.drawing.useEditTool',
	defaultMessage: 'Use Edit Tool'
});
export const useMoveToolLabel = (): string => intl.formatMessage({
	id: 'label.drawing.useMoveTool',
	defaultMessage: 'Use Move Tool'
});
export const usePencilBrushToolLabel = (): string => intl.formatMessage({
	id: 'label.drawing.usePencilBrushTool',
	defaultMessage: 'Use Pencil Brush Tool'
});
export const useTextToolLabel = (): string => intl.formatMessage({
	id: 'label.drawing.useTextTool',
	defaultMessage: 'Use Text Tool'
});
export const useEraserToolLabel = (): string => intl.formatMessage({
	id: 'label.drawing.useEraserTool',
	defaultMessage: 'Use Eraser Tool'
});
export const increaseSizeLabel = (): string => intl.formatMessage({
	id: 'label.drawing.increaseSize',
	defaultMessage: 'Increase Size'
});
export const decreaseSizeLabel = (): string => intl.formatMessage({
	id: 'label.drawing.decreaseSize',
	defaultMessage: 'Decrease Size'
});
export const undoLabel = (): string => intl.formatMessage({
	id: 'label.drawing.undo',
	defaultMessage: 'Undo'
});
export const redoLabel = (): string => intl.formatMessage({
	id: 'label.drawing.redo',
	defaultMessage: 'Redo'
});
export const volumeLabel = (): string => intl.formatMessage({
	id: 'label.volume',
	defaultMessage: 'Volume'
});
export const deleteImageLabel = (name: string): string => intl.formatMessage({
	id: 'label.background.deleteImage',
	defaultMessage: 'delete {name}'
}, { name });
export const loginToUseManagementLabel = (): string => intl.formatMessage({
	id: 'label.admin.loginToUseManagement',
	defaultMessage: 'Login to use management functions'
});
export const localAdminLoginLabel = (): string => intl.formatMessage({
	id: 'label.admin.localAdminLogin',
	defaultMessage: 'Local admin login'
});
export const emailAddressLabel = (): string => intl.formatMessage({
	id: 'label.admin.emailAddress',
	defaultMessage: 'Email Address'
});
export const passwordLabel = (): string => intl.formatMessage({
	id: 'label.password',
	defaultMessage: 'Password'
});
export const signInLabel = (): string => intl.formatMessage({
	id: 'label.admin.signIn',
	defaultMessage: 'Sign In'
});
export const tenantLoginLabel = (): string => intl.formatMessage({
	id: 'label.admin.tenantLogin',
	defaultMessage: 'Tenant Login'
});
export const confirmLabel = (): string => intl.formatMessage({
	id: 'label.confirm',
	defaultMessage: 'Confirm'
});
export const asPngLabel = (): string => intl.formatMessage({
	id: 'label.drawing.asPng',
	defaultMessage: 'As PNG'
});
export const asJpegLabel = (): string => intl.formatMessage({
	id: 'label.drawing.asJpeg',
	defaultMessage: 'As JPEG'
});
export const asSvgLabel = (): string => intl.formatMessage({
	id: 'label.drawing.asSvg',
	defaultMessage: 'As SVG'
});
export const colorNameLabel = (color: string): string => intl.formatMessage({
	id: `label.color.${color}`,
	defaultMessage: color
});
export const useColorLabel = (color: string): string => intl.formatMessage({
	id: 'label.drawing.useColor',
	defaultMessage: 'Use {color}'
}, { color: colorNameLabel(color) });
export const disableUnmanagedRoomsTooltipLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.disableUnmanagedRoomsTooltip',
	defaultMessage: 'When enabled, users cannot create or join unmanaged (ad-hoc) rooms. Only pre-configured managed rooms will be accessible for this tenant.'
});
export const roomLockedTooltipLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.roomLockedTooltip',
	defaultMessage: 'When enabled, new unmanaged rooms start in a locked state. Only the first user to join who is authenticated (logged in via SSO/management) can bypass the lock and admit others from the lobby. All other users, including subsequent authenticated users, will be placed in the lobby.'
});
export const selectButtonLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.selectButton',
	defaultMessage: 'Select'
});
export const userEmailLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.userEmail',
	defaultMessage: 'User email'
});
export const roomOwnersLabel = (): string => intl.formatMessage({
	id: 'label.management.roomOwners',
	defaultMessage: 'Room owners'
});
export const roomUserRolesLabel = (): string => intl.formatMessage({
	id: 'label.management.roomUserRoles',
	defaultMessage: 'Room-User roles'
});
export const hideUserDetailsLabel = (): string => intl.formatMessage({
	id: 'label.managementservice.hideUserDetails',
	defaultMessage: 'Hide user details (email, name) from non-admin users'
});

export const managePermissionsLabel = (): string => intl.formatMessage({
	id: 'label.managePermissions',
	defaultMessage: 'Manage permissions'
});

export const selectAllLabel = (): string => intl.formatMessage({
	id: 'label.selectAll',
	defaultMessage: 'Select all'
});

export const selectPeersFirstLabel = (): string => intl.formatMessage({
	id: 'label.permissions.selectPeersFirst',
	defaultMessage: 'Select one or more peers to edit their permissions.'
});

export const noOtherPeersLabel = (): string => intl.formatMessage({
	id: 'label.permissions.noOtherPeers',
	defaultMessage: 'No other peers are in the room.'
});

export const applyPermissionsLabel = (count: number): string => intl.formatMessage({
	id: 'label.permissions.apply',
	defaultMessage: 'Apply changes ({count})'
}, { count });

export const pendingChangesLabel = (): string => intl.formatMessage({
	id: 'label.permissions.pendingChanges',
	defaultMessage: 'Pending changes'
});

export const resetDraftLabel = (): string => intl.formatMessage({
	id: 'label.permissions.resetDraft',
	defaultMessage: 'Reset'
});

export const discardChangesLabel = (): string => intl.formatMessage({
	id: 'label.permissions.discardChanges',
	defaultMessage: 'Discard unsaved changes?'
});

export const permissionGrantedLabel = (list: string): string => intl.formatMessage({
	id: 'label.permissions.granted',
	defaultMessage: 'Permission granted: {list}'
}, { list });

export const permissionRevokedLabel = (list: string): string => intl.formatMessage({
	id: 'label.permissions.revoked',
	defaultMessage: 'Permission revoked: {list}'
}, { list });

export const claimRoomNoticeLabel = (): string => intl.formatMessage({
	id: 'label.room.claimNotice',
	defaultMessage: 'Settings will take effect on the next meeting after everyone has left. Continue?'
});

export const permissionDescriptions: Record<string, () => string> = {
	BYPASS_ROOM_LOCK: () => intl.formatMessage({
		id: 'label.permission.description.BYPASS_ROOM_LOCK',
		defaultMessage: 'Allows the user to enter the room even when the room is locked.'
	}),
	CHANGE_ROOM_LOCK: () => intl.formatMessage({
		id: 'label.permission.description.CHANGE_ROOM_LOCK',
		defaultMessage: 'Allows the user to lock or unlock the room.'
	}),
	PROMOTE_PEER: () => intl.formatMessage({
		id: 'label.permission.description.PROMOTE_PEER',
		defaultMessage: 'Allows the user to admit peers from the lobby into the room.'
	}),
	MODIFY_ROLE: () => intl.formatMessage({
		id: 'label.permission.description.MODIFY_ROLE',
		defaultMessage: 'Allows the user to grant or revoke roles of other peers. (currently not used)'
	}),
	SEND_CHAT: () => intl.formatMessage({
		id: 'label.permission.description.SEND_CHAT',
		defaultMessage: 'Allows the user to send chat messages.'
	}),
	MODERATE_CHAT: () => intl.formatMessage({
		id: 'label.permission.description.MODERATE_CHAT',
		defaultMessage: 'Allows the user to moderate chat and clear chat history.'
	}),
	SHARE_AUDIO: () => intl.formatMessage({
		id: 'label.permission.description.SHARE_AUDIO',
		defaultMessage: 'Allows the user to share their microphone.'
	}),
	SHARE_VIDEO: () => intl.formatMessage({
		id: 'label.permission.description.SHARE_VIDEO',
		defaultMessage: 'Allows the user to share their webcam.'
	}),
	SHARE_SCREEN: () => intl.formatMessage({
		id: 'label.permission.description.SHARE_SCREEN',
		defaultMessage: 'Allows the user to share their screen.'
	}),
	SHARE_EXTRA_VIDEO: () => intl.formatMessage({
		id: 'label.permission.description.SHARE_EXTRA_VIDEO',
		defaultMessage: 'Allows the user to share additional video sources beyond their webcam.'
	}),
	SHARE_FILE: () => intl.formatMessage({
		id: 'label.permission.description.SHARE_FILE',
		defaultMessage: 'Allows the user to share files with other peers in the room.'
	}),
	MODERATE_FILES: () => intl.formatMessage({
		id: 'label.permission.description.MODERATE_FILES',
		defaultMessage: 'Allows the user to moderate shared files and clear file history.'
	}),
	MODERATE_ROOM: () => intl.formatMessage({
		id: 'label.permission.description.MODERATE_ROOM',
		defaultMessage: 'Allows the user to moderate the room: kick peers, mute all, stop video, manage permissions.'
	}),
	LOCAL_RECORD_ROOM: () => intl.formatMessage({
		id: 'label.permission.description.LOCAL_RECORD_ROOM',
		defaultMessage: 'Allows the user to record the meeting locally on their own device.'
	}),
	CREATE_ROOM: () => intl.formatMessage({
		id: 'label.permission.description.CREATE_ROOM',
		defaultMessage: 'Allows the user to create breakout rooms.'
	}),
	CHANGE_ROOM: () => intl.formatMessage({
		id: 'label.permission.description.CHANGE_ROOM',
		defaultMessage: 'Allows the user to join or leave breakout rooms.'
	}),
};

// Meeting / calendar invite labels
export const meetingsLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings',
	defaultMessage: 'Meetings'
});
export const scheduleMeetingLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.schedule',
	defaultMessage: 'Schedule meeting'
});
export const myMeetingsLabel = (): string => intl.formatMessage({
	id: 'label.landing.myMeetings',
	defaultMessage: 'My meetings'
});
export const titleLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.title',
	defaultMessage: 'Title'
});
export const startsAtLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.startsAt',
	defaultMessage: 'Starts at'
});
export const endsAtLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.endsAt',
	defaultMessage: 'Ends at'
});
export const timezoneLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.timezone',
	defaultMessage: 'Timezone'
});
export const inviteLanguageLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.inviteLanguage',
	defaultMessage: 'Invite language'
});
export const repeatsLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeats',
	defaultMessage: 'Repeats'
});
export const showPastMeetingsLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.showPast',
	defaultMessage: 'Show past meetings'
});
export const organizerRoleLabel = (): string => intl.formatMessage({
	id: 'label.meetings.role.organizer',
	defaultMessage: 'Organizer'
});
export const attendeeRoleLabel = (): string => intl.formatMessage({
	id: 'label.meetings.role.attendee',
	defaultMessage: 'Attendee'
});
export const repeatNeverLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.never',
	defaultMessage: 'Never'
});
export const repeatDailyLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.daily',
	defaultMessage: 'Daily'
});
export const repeatWeeklyLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.weekly',
	defaultMessage: 'Weekly'
});
export const repeatMonthlyLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.monthly',
	defaultMessage: 'Monthly'
});
export const repeatIntervalLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.interval',
	defaultMessage: 'Every'
});
export const repeatCountLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.repeat.count',
	defaultMessage: 'Number of occurrences'
});
export const attendeesLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.attendees',
	defaultMessage: 'Attendees'
});
export const addAttendeeLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.addAttendee',
	defaultMessage: 'Add attendee'
});
export const partstatAcceptedLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.partstat.accepted',
	defaultMessage: 'Accepted'
});
export const partstatDeclinedLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.partstat.declined',
	defaultMessage: 'Declined'
});
export const partstatTentativeLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.partstat.tentative',
	defaultMessage: 'Tentative'
});
export const partstatNeedsActionLabel = (): string => intl.formatMessage({
	id: 'label.management.meetings.partstat.needsAction',
	defaultMessage: 'Pending'
});
export const inviteEmailConfigLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.inviteEmailConfig',
	defaultMessage: 'Invite email (SMTP/IMAP)'
});
export const sendTestInviteLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.sendTestInvite',
	defaultMessage: 'Send test invite'
});
export const testConnectionLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.testConnection',
	defaultMessage: 'Test connection'
});
export const inviteEnabledLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.inviteEnabled',
	defaultMessage: 'Invites enabled'
});
export const organizerAddressLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.organizerAddress',
	defaultMessage: 'Organizer email address'
});
export const organizerNameLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.organizerName',
	defaultMessage: 'Organizer display name'
});
export const smtpHostLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.smtpHost',
	defaultMessage: 'SMTP host'
});
export const smtpPortLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.smtpPort',
	defaultMessage: 'SMTP port'
});
export const smtpSecureLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.smtpSecure',
	defaultMessage: 'SMTP TLS'
});
export const smtpUserLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.smtpUser',
	defaultMessage: 'SMTP user'
});
export const smtpPasswordLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.smtpPassword',
	defaultMessage: 'SMTP password'
});
export const imapHostLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapHost',
	defaultMessage: 'IMAP host'
});
export const imapPortLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapPort',
	defaultMessage: 'IMAP port'
});
export const imapSecureLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapSecure',
	defaultMessage: 'IMAP TLS'
});
export const imapUserLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapUser',
	defaultMessage: 'IMAP user'
});
export const imapPasswordLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapPassword',
	defaultMessage: 'IMAP password'
});
export const imapOptionalNoteLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.imapOptionalNote',
	defaultMessage: 'IMAP is optional. Provide to track RSVP status.'
});
export const passwordUnchangedLabel = (): string => intl.formatMessage({
	id: 'label.management.tenants.passwordUnchanged',
	defaultMessage: 'Leave blank to keep existing password'
});
export const refreshLabel = (): string => intl.formatMessage({
	id: 'label.generic.refresh',
	defaultMessage: 'Refresh'
});
export const manageMeetingsLabel = (): string => intl.formatMessage({
	id: 'label.meetings.manage',
	defaultMessage: 'Manage meetings'
});
export const noUpcomingMeetingsLabel = (): string => intl.formatMessage({
	id: 'label.meetings.noUpcoming',
	defaultMessage: 'No upcoming meetings'
});
export const upcomingMeetingsLabel = (): string => intl.formatMessage({
	id: 'label.meetings.upcoming',
	defaultMessage: 'Upcoming meetings'
});
