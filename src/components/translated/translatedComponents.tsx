import { intl } from '../../utils/intlManager';

export const noLabel = (): string => intl.formatMessage({
	id: 'label.no',
	defaultMessage: 'No'
});

export const yesLabel = (): string => intl.formatMessage({
	id: 'label.yes',
	defaultMessage: 'Yes'
});

export const defaultLabel = (): string => intl.formatMessage({
	id: 'label.default',
	defaultMessage: 'Default'
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

export const currentlySelectedLabel = (): string => intl.formatMessage({
	id: 'settings.currentlySelected',
	defaultMessage: 'Currently Selected'
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