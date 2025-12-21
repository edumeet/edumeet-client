import { ThemeOptions } from '@mui/material';
import { ClientMonitorConfig } from '@observertc/client-monitor-js';
import { TFLite } from '../services/effectsService';

export const defaultEdumeetConfig: EdumeetConfig = {
	qrCodeEnabled: false,
	countdownTimerEnabled: false,
	infoTooltipEnabled: false,
	infoTooltipText: '',
	infoTooltipLink: '',
	infoTooltipDesc: '',
	managementUrl: undefined,
	loginImageURL: '',
	p2penabled: false,
	loginEnabled: false,
	developmentPort: 8443,
	productionPort: 443,
	serverHostname: undefined,
	askForMediaOnJoin: true,
	hideNonVideo: false,
	hideSelfView: false,
	resolution: 'medium',
	frameRate: 30,
	screenSharingResolution: 'veryhigh',
	screenSharingFrameRate: 5,
	aspectRatio: 1.7778, // 16:9
	simulcast: true,
	simulcastSharing: false,
	autoGainControl: true,
	echoCancellation: true,
	noiseSuppression: true,
	noiseThreshold: -60,
	sampleRate: 48000,
	channelCount: 1,
	sampleSize: 16,
	opusStereo: false,
	opusDtx: true,
	opusFec: true,
	opusPtime: 20,
	opusMaxPlaybackRate: 48000,
	audioPreset: 'conference',
	audioPresets: {
		conference: {
			'name': 'Conference audio',
			'autoGainControl': true,
			'echoCancellation': true,
			'noiseSuppression': true,
			'noiseThreshold': -60,
			'sampleRate': 48000,
			'channelCount': 1,
			'sampleSize': 16,
			'opusStereo': false,
			'opusDtx': true,
			'opusFec': true,
			'opusPtime': 20,
			'opusMaxPlaybackRate': 48000
		},
		hifi: {
			'name': 'HiFi streaming',
			'autoGainControl': false,
			'echoCancellation': false,
			'noiseSuppression': false,
			'noiseThreshold': -60,
			'sampleRate': 48000,
			'channelCount': 2,
			'sampleSize': 16,
			'opusStereo': true,
			'opusDtx': false,
			'opusFec': true,
			'opusPtime': 60,
			'opusMaxPlaybackRate': 48000
		}
	},
	buttonControlBar: true,
	notificationSounds: {
		'chatMessage': {
			'play': '/sounds/notify-chat.mp3'
		},
		'raisedHand': {
			'play': '/sounds/notify-hand.mp3'
		},
		'finishedCountdownTimer': {
			'play': '/sounds/notify-countdowntimer.mp3'
		},
		'reactionThumbup': {
			'play': '/sounds/notify-thumbup.mp3',
		},
		'reactionClap': {
			'play': '/sounds/notify-clap.mp3',
		},
		'reactionParty': {
			'play': '/sounds/notify-party.mp3',
		},
		'reactionLaugh': {
			'play': '/sounds/notify-laugh.mp3',
		},
		'default': {
			'debounce': 5000,
			'play': '/sounds/notify.mp3'
		}
	},
	reactionsSoundEnabled: false,
	title: 'edumeet',
	randomizeOnBlank: true,
	transcriptionEnabled: true,
	theme: {
		background: 'linear-gradient(135deg, rgba(1,42,74,1) 0%, rgba(1,58,99,1) 50%, rgba(1,73,124,1) 100%)',
		appBarColor: 'rgba(0, 0, 0, 0.4)',
		appBarFloating: true,
		logo: 'images/logo.edumeet.svg',
		activeSpeakerBorder: '1px solid rgba(255, 255, 255, 1.0)',
		videoBackroundColor: 'rgba(49, 49, 49, 0.9)',
		videoAvatarImage: 'images/buddy.svg',
		roundedness: 10,
		sideContentItemColor: 'rgba(255, 255, 255, 0.4)',
		sideContentItemDarkColor: 'rgba(150, 150, 150, 0.4)',
		sideContainerBackgroundColor: 'rgba(255, 255, 255, 0.7)',
	},
	reduxLoggingEnabled: false,
	clientMontitor: {
		collectingPeriodInMs: 2000,
	},
	imprintUrl: '',
	privacyUrl: '',
	reactionsTimeout: 10000
};

export interface EdumeetConfig {
	qrCodeEnabled: boolean;
	countdownTimerEnabled: boolean,
	infoTooltipEnabled: boolean;
	infoTooltipText?: string;
	infoTooltipLink?: string;
	infoTooltipDesc?: string;
	managementUrl?: string;
	loginImageURL?: string;
	p2penabled: boolean;
	loginEnabled: boolean;
	developmentPort: number;
	productionPort: number;
	serverHostname?: string;
	askForMediaOnJoin: boolean;
	hideNonVideo: boolean;
	hideSelfView: boolean;
	resolution: Resolution;
	frameRate: number;
	screenSharingResolution: Resolution;
	screenSharingFrameRate: number;
	aspectRatio: number;
	simulcast: boolean;
	simulcastSharing: boolean;
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	noiseThreshold: number;
	sampleRate: number;
	channelCount: number;
	sampleSize: number;
	opusStereo: boolean;
	opusDtx: boolean;
	opusFec: boolean;
	opusPtime: number;
	opusMaxPlaybackRate: number;
	audioPreset: string;
	audioPresets: Record<string, AudioPreset>;
	buttonControlBar: boolean;
	notificationSounds: Record<NotificationType, NotificationSound>;
	reactionsSoundEnabled: boolean;
	title: string;
	randomizeOnBlank: boolean;
	transcriptionEnabled: boolean;
	theme: ThemeOptions;
	reduxLoggingEnabled: boolean;
	clientMontitor: ClientMonitorConfig;
	imprintUrl: string;
	privacyUrl: string;
	reactionsTimeout: number;
}

export interface HTMLMediaElementWithSink extends HTMLMediaElement {
	// eslint-disable-next-line no-unused-vars
	setSinkId(deviceId: string): Promise<void>
}

export type Resolution = 'low' | 'medium' | 'high' | 'veryhigh' | 'ultra';

export interface SimulcastProfile {
	scaleResolutionDownBy?: number;
	scalabilityMode?: string;
	maxBitrate: number;
}

export interface AudioPreset {
	name: string;
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	noiseThreshold: number;
	sampleRate: number;
	channelCount: number;
	sampleSize: number;
	opusStereo: boolean;
	opusDtx: boolean;
	opusFec: boolean;
	opusPtime: number;
	opusMaxPlaybackRate: number;
}

export type NotificationType = 'default' | 'chatMessage' | 'raisedHand' | 'finishedCountdownTimer' | 'reactionThumbup' | 'reactionClap' | 'reactionParty' | 'reactionLaugh';

export interface NotificationSound {
	play: string;
	debounce?: number;
}

export interface ChatMessage {
	peerId: string;
	sessionId: string;
	displayName?: string;
	timestamp?: number;
	text?: string;
}

export interface FilesharingFile {
	peerId: string;
	sessionId: string;
	displayName?: string;
	timestamp?: number;
	magnetURI: string;
	started?: boolean;
}

export interface SocketMessage {
	method: string; // TODO: define inbound notification method strings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any; // TODO: define inbound notification data
}

export type InboundNotification = (
	// eslint-disable-next-line no-unused-vars
	notification: SocketMessage
) => void;

export type InboundRequest = (
	// eslint-disable-next-line no-unused-vars
	request: SocketMessage,
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
	respond: (response: any) => void,
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
	reject: (error: any) => void
) => void;

export type ProducerSource = 'mic' | 'webcam' | 'screen' | 'screenaudio' | 'extravideo' | 'extraaudio';

export type MediaState = 'unsupported' | 'off' | 'on' | 'muted';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColor = 'inherit' | 'error' | 'primary' | 'secondary' | 'default' | 'success' | 'info' | 'warning';

export interface RTCStatsOptions {
	url: string;
	useLegacy: boolean;
	obfuscate: boolean;
	wsPingIntervalMs: number;
	pollIntervalMs: number;
	sendSDP: boolean;
}

export interface RTCStatsMetaData {
	applicationName: string;
	confName: string;
	confID: string;
	meetingUniqueId: string;
	endpointId: string;
	deviceId: string;
	displayName: string;
}

export interface Dimensions {
	width: number,
	height: number
}

export interface BackgroundEffectPipeline {
	render: () => void;
	cleanup: () => void;
}

export interface Dimensions {
	width: number,
	height: number
}

export const BackgroundType = {
	NONE: 'none',
	BLUR: 'blur',
	IMAGE: 'image'
} as const;

export type BackgroundType = typeof BackgroundType[keyof typeof BackgroundType];

export type BackgroundConfig = {
	type: BackgroundType;
	url?: string;
};

export interface BackgroundPipelineOptions {
	source: {
		element: HTMLVideoElement,
		dimensions: Dimensions
	},
	canvas: HTMLCanvasElement,
	backend: TFLite,
	segmentation: Dimensions,
	backgroundConfig?: BackgroundConfig
}

export interface HTMLMediaElementWithSink extends HTMLMediaElement {
	// eslint-disable-next-line no-unused-vars
	setSinkId(deviceId: string): Promise<void>
}

export type Tenant = {
	id: number,
	name: string,
	description: string
};
export type TenantOptionTypes = Array<Tenant>

export type TenantFQDN = {
	id: number,
	tenantId: number,
	description: string,
	fqdn: string
};

export type TenantOAuth = {
	id: number,
	tenantId: number,
	access_url: string,
	authorize_url: string,
	profile_url: string,
	redirect_uri: string,
	scope: string,
	scope_delimiter: string,
};

export type User = {
	id: number,
	ssoId: string,
	tenantId: number,
	email: string,
	name: string,
	avatar: string,
	roles: [],
	tenantAdmin: boolean,
	tenantOwner: boolean
};
export type UserTypes = Array<User>;

export type Roles = {
	id: number,
	name: string,
	description: string,
	tenantId: number
	permissions: Array<Permissions>
};

export type RoleOptionTypes = Array<Roles>

export type GroupRoles = {
	id: number,
	groupId: number,
	role: Roles,
	roleId: number,
	roomId: number
};

export type UsersRoles = {
	id: number,
	userId: number,
	role: Roles,
	roleId: number,
	roomId: number
};

export type RoomOwners = {
	id: number,
	roomId: number,
	userId: number,
};
export type TenantOwners = {
	id: number,
	tenantId: number,
	userId: number,
};

export type TenantAdmins = {
	id: number,
	tenantId: number,
	userId: number,
};

export type Permissions = {
	id: number,
	name: string,
	description: string,
};

export type RolePermissions = {
	id: number,
	permission: Permissions
	permissionId: number,
	roleId: number,
};

export type Room = {
	id?: number,
	name?: string,
	description: string,
	createdAt?: string,
	updatedAt?: string,
	creatorId?: string,
	defaultRoleId?: number | string,
	tenantId?: number | null,
	logo: string | null,
	background: string | null,
	maxActiveVideos: number,
	locked: boolean,
	chatEnabled: boolean,
	raiseHandEnabled: boolean,
	reactionsEnabled: boolean,
	filesharingEnabled: boolean,
	groupRoles?: Array<Roles>,
	localRecordingEnabled: boolean,
	owners?: Array<RoomOwners>,
	breakoutsEnabled: boolean,
};

export type Groups = {
	id: number,
	name: string,
	description: string,
	tenantId: number
};

export type GroupUsers = {
	id: number,
	groupId: number,
	userId: number
};
export type Rule = {
	id: number,
	name?: string,
	tenantId?: number | null,
	parameter: string,
	method: string,
	negate: boolean,
	value: string,
	action: string,
	type: string,
}
export type Default = {
	id: number,
	tenantId: string, // number,
	numberLimit: string, // number,
	liveNumberLimit: string, // number,
	userManagedRoomNumberLimit: string, // number,
	managerManagedRoomNumberLimit: string, // number,
	lockedUnmanaged: boolean | undefined,
	raiseHandEnabledUnmanaged: boolean | undefined,
	localRecordingEnabledUnmanaged: boolean | undefined,
	lockedLock: boolean | undefined,
	raiseHandEnabledLock: boolean | undefined,
	localRecordingEnabledLock: boolean | undefined,
	chatEnabledUnmanaged: boolean | undefined,
	breakoutsEnabledUnmanaged: boolean | undefined,
	filesharingEnabledUnmanaged: boolean | undefined,
	reactionsEnabledLock: boolean | undefined,
	reactionsEnabledUnmanaged: boolean | undefined,
	chatEnabledLock: boolean | undefined,
	breakoutsEnabledLock: boolean | undefined,
	filesharingEnabledLock: boolean | undefined,
	tracker: string,
	maxFileSize: string, // number,
	background: string,
	logo: string,
	defaultRoleId: string, // number,
	tenantPermissionLimitRole: string, // number,
}
export type DefaultOptionTypes = Array<Default>
