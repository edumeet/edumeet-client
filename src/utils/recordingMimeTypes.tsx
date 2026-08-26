export interface RecordingMimeType {
	mimeType: string;
	extension: string;
	name: string;
	browserDefault?: boolean;
}

const RECORDING_MIME_TYPES: Array<RecordingMimeType> = [
	{ mimeType: 'video/mp4;codecs="avc3.42E01E,mp4a.40.2"', extension: 'mp4', name: 'MP4 (H.264 avc3 + AAC)' },
	{ mimeType: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', extension: 'mp4', name: 'MP4 (H.264 avc1 + AAC)' },
	{ mimeType: 'video/mp4', extension: 'mp4', name: 'MP4', browserDefault: true },
	{ mimeType: 'video/x-matroska;codecs=avc1', extension: 'mkv', name: 'MKV (H.264)' },
	{ mimeType: 'video/webm;codecs="vp8,opus"', extension: 'webm', name: 'WebM (VP8 + Opus)' },
	{ mimeType: 'video/webm;codecs="vp9,opus"', extension: 'webm', name: 'WebM (VP9 + Opus)' },
	{ mimeType: 'video/webm', extension: 'webm', name: 'WebM', browserDefault: true }
];

export const supportedRecordingMimeTypes = (): Array<RecordingMimeType> => {
	if (typeof MediaRecorder === 'undefined') return [];

	return RECORDING_MIME_TYPES.filter(({ mimeType }) => MediaRecorder.isTypeSupported(mimeType));
};

export const isRecordingMimeTypeSupported = (mimeType: string): boolean =>
	supportedRecordingMimeTypes().some((type) => type.mimeType === mimeType);

export const resolveRecordingMimeType = (preferred?: string): RecordingMimeType | undefined => {
	const supported = supportedRecordingMimeTypes();

	return supported.find(({ mimeType }) => mimeType === preferred) ?? supported[0];
};

export const recordingContainer = (mimeType: string): string => mimeType.split(';')[0];
