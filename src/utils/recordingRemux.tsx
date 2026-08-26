import {
	ALL_FORMATS,
	BlobSource,
	Conversion,
	Input,
	MkvOutputFormat,
	Mp4OutputFormat,
	Output,
	OutputFormat,
	StreamTarget,
	StreamTargetChunk,
	WebMOutputFormat
} from 'mediabunny';
import { Logger } from './Logger';

const logger = new Logger('RecordingRemux');

/* eslint-disable no-unused-vars */
export type ProgressCallback = (progress: number) => void;
/* eslint-enable no-unused-vars */

export interface PositionedWriter {
	/* eslint-disable no-unused-vars */
	write(data: Uint8Array<ArrayBuffer>, position: number): Promise<void>;
	/* eslint-enable no-unused-vars */
	close(): Promise<void>;
}

const outputFormat = (extension: string): OutputFormat => {
	if (extension === 'webm') return new WebMOutputFormat({ appendOnly: false });
	if (extension === 'mkv') return new MkvOutputFormat({ appendOnly: false });

	return new Mp4OutputFormat({ fastStart: false });
};

const streamTarget = (writer: PositionedWriter): StreamTarget => new StreamTarget(
	new WritableStream<StreamTargetChunk>({
		write: (chunk) => writer.write(chunk.data, chunk.position)
	}),
	{ chunked: true }
);

export const remuxRecording = async (
	file: File,
	extension: string,
	writer: PositionedWriter,
	onProgress?: ProgressCallback
): Promise<void> => {
	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	const output = new Output({ format: outputFormat(extension), target: streamTarget(writer) });
	const conversion = await Conversion.init({ input, output });

	if (onProgress) conversion.onProgress = (progress) => onProgress(progress);

	if (!conversion.isValid) {
		logger.warn('remuxRecording() [discarded:%o]', conversion.discardedTracks);

		throw new Error('conversion is not valid');
	}

	await conversion.execute();
};
