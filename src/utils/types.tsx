import { ThemeOptions } from '@mui/material';
import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/RtpParameters';
import { DtlsParameters } from 'mediasoup-client/lib/Transport';

export const defaultEdumeetConfig: EdumeetConfig = {
	loginEnabled: false,
	developmentPort: 8443,
	productionPort: 443,
	serverHostname: undefined,
	lastN: 11,
	hideNonVideo: false,
	resolution: 'medium',
	frameRate: 30,
	screenSharingResolution: 'veryhigh',
	screenSharingFrameRate: 5,
	aspectRatio: 1.7778, // 16:9
	simulcast: true,
	simulcastSharing: false,
	simulcastProfiles: {
		'320': [ {
			'scaleResolutionDownBy': 1,
			'maxBitRate': 150000
		} ],
		'640': [ {
			'scaleResolutionDownBy': 2,
			'maxBitRate': 150000
		}, {
			'scaleResolutionDownBy': 1,
			'maxBitRate': 500000
		} ],
		'1280': [ {
			'scaleResolutionDownBy': 4,
			'maxBitRate': 150000
		}, {
			'scaleResolutionDownBy': 2,
			'maxBitRate': 500000
		}, {
			'scaleResolutionDownBy': 1,
			'maxBitRate': 1200000
		} ],
		'1920': [ {
			'scaleResolutionDownBy': 6,
			'maxBitRate': 150000
		}, {
			'scaleResolutionDownBy': 3,
			'maxBitRate': 500000
		}, {
			'scaleResolutionDownBy': 1,
			'maxBitRate': 3500000
		} ],
		'3840': [ {
			'scaleResolutionDownBy': 12,
			'maxBitRate': 150000
		}, {
			'scaleResolutionDownBy': 6,
			'maxBitRate': 500000
		}, {
			'scaleResolutionDownBy': 1,
			'maxBitRate': 10000000
		} ]
	},
	localRecordingEnabled: false,
	requestTimeout: 20000,
	requestRetries: 3,
	autoGainControl: true,
	echoCancellation: true,
	noiseSuppression: true,
	voiceActivatedUnmute: false,
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
			'voiceActivatedUnmute': false,
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
			'voiceActivatedUnmute': false,
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
	autoMuteThreshold: 4,
	defaultLayout: 'democratic',
	buttonControlBar: false,
	notificationPosition: 'right',
	title: 'edumeet',
	supportUrl: 'https://support.example.com',
	privacyUrl: 'privacy/privacy.html',
	theme: {
		backgroundImage: 'images/background.jpg',
		appBarColor: '#313131',
		logo: 'images/logo.edumeet.svg',
		activeSpeakerBorder: '1px solid rgba(255, 255, 255, 1.0)',
		peerBackroundColor: 'rgba(49, 49, 49, 0.9)',
		peerShadow: '0px',
		peerAvatar: 'images/buddy.svg',
		chatColor: 'rgba(224, 224, 224, 0.52)'
	}
};

export interface EdumeetConfig {
	loginEnabled: boolean;
	developmentPort: number;
	productionPort: number;
	serverHostname?: string;
	lastN: number;
	hideNonVideo: boolean;
	resolution: Resolution;
	frameRate: number;
	screenSharingResolution: Resolution;
	screenSharingFrameRate: number;
	aspectRatio: number;
	simulcast: boolean;
	simulcastSharing: boolean;
	simulcastProfiles: Record<string, SimulcastProfile[]>;
	localRecordingEnabled: boolean;
	requestTimeout: number;
	requestRetries: number;
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	voiceActivatedUnmute: boolean;
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
	autoMuteThreshold: number;
	defaultLayout: RoomLayout;
	buttonControlBar: boolean;
	notificationPosition: 'right' | 'left';
	title: string;
	supportUrl: string;
	privacyUrl: string;
	theme: ThemeOptions;
}

export type RoomLayout = 'filmstrip' | 'democratic';

export type Resolution = 'low' | 'medium' | 'high' | 'veryhigh' | 'ultra';

export interface SimulcastProfile {
	scaleResolutionDownBy: number;
	maxBitRate: number;
}

export interface AudioPreset {
	name: string;
	autoGainControl: boolean;
	echoCancellation: boolean;
	noiseSuppression: boolean;
	voiceActivatedUnmute: boolean;
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

export interface ChatMessage {
	peerId: string;
	displayName?: string;
	timestamp?: number;
	text?: string;
}

export interface FilesharingFile {
	peerId: string;
	displayName?: string;
	timestamp?: number;
	magnetURI: string;
	started?: boolean;
}

export interface SocketInboundNotification {
	method: string; // TODO: define inbound notification method strings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any; // TODO: define inbound notification data
}

export interface SocketOutboundRequest {
	method: string; // TODO: define outbound request method strings
	data?:
		CreateWebRtcTransport |
		ConnectWebRtcTransport |
		ProduceData |
		ConsumerData |
		JoinData |
		ProducerData |
		DataConsumerData |
		DisplayNameData |
		PromotePeerData |
		ChatMessageData |
		FilesharingData |
		ConsumerPreferredLayersData |
		P2PData;
}

export interface JoinData {
	displayName: string;
	picture: string;
	rtpCapabilities: RtpCapabilities;
	returning?: boolean;
}

export interface ConsumerData {
	consumerId: string;
}

export interface ConsumerPreferredLayersData extends ConsumerData {
	spatialLayer: number;
	temporalLayer: number;
}

export interface CreateWebRtcTransport {
	forceTcp: boolean;
	producing: boolean;
	consuming: boolean;
}

export interface ConnectWebRtcTransport {
	transportId: string;
	dtlsParameters: DtlsParameters;
}

export interface ProduceData {
	transportId: string;
	kind: MediaKind;
	rtpParameters: RtpParameters;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	appData?: any;
}

export interface ProducerData {
	producerId: string;
}

export interface DisplayNameData {
	displayName: string;
}

export interface PromotePeerData {
	peerId: string;
}

export interface ChatMessageData {
	text?: string;
}

export interface FilesharingData {
	magnetURI?: string;
}

export interface P2PData {
	peerId: string;
	offer?: RTCSessionDescription;
	answer?: RTCSessionDescription;
	candidate?: RTCIceCandidate;
}

export interface DataConsumerData {
	dataConsumerId: string;
}

export type MediaState = 'unsupported' | 'off' | 'on' | 'muted';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColor = 'inherit' | 'error' | 'primary' | 'secondary' | 'default' | 'success' | 'info' | 'warning';