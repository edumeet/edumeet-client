import { ThemeOptions } from '@mui/material';
import { TFLite } from '../services/effectsService';

export const defaultEdumeetConfig: EdumeetConfig = {
	managementUrl: undefined,
	impressumUrl: '/privacy/privacy.html',
	p2penabled: false,
	loginEnabled: false,
	developmentPort: 8443,
	productionPort: 443,
	serverHostname: undefined,
	askForMediaOnJoin: true,
	hideNonVideo: false,
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
		'default': {
			'debounce': 5000,
			'play': '/sounds/notify.mp3'
		}
	},
	title: 'edumeet',
	randomizeOnBlank: true,
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
	reduxLoggingEnabled: false
};

export interface EdumeetConfig {
	managementUrl?: string;
	impressumUrl: string;
	p2penabled: boolean;
	loginEnabled: boolean;
	developmentPort: number;
	productionPort: number;
	serverHostname?: string;
	askForMediaOnJoin: boolean;
	hideNonVideo: boolean;
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
	title: string;
	randomizeOnBlank: boolean;
	theme: ThemeOptions;
	reduxLoggingEnabled: boolean;
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

export type NotificationType = 'default' | 'chatMessage' | 'raisedHand';

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

export interface BlurBackgroundPipeline {
	render: () => void;
	cleanup: () => void;
}

export interface Dimensions {
	width: number,
	height: number
}

export interface BlurBackgroundPipelineOptions {
    source: {
        element: HTMLVideoElement,
        dimensions: Dimensions
    },
    canvas: HTMLCanvasElement,
    backend: TFLite,
    segmentation: Dimensions
}

export interface HTMLMediaElementWithSink extends HTMLMediaElement {
	// eslint-disable-next-line no-unused-vars
	setSinkId(deviceId: string): Promise<void>
}
