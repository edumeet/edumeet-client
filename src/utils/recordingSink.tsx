import { Logger } from './Logger';
import { recordingContainer } from './recordingMimeTypes';
import type { PositionedWriter } from './recordingRemux';

const logger = new Logger('RecordingSink');

const OPFS_DIRECTORY = 'recordings';
const METADATA_KEY = 'edumeetRecording';
const CLEANUP_KEY = 'edumeetRecordingCleanup';
const DOWNLOAD_URL_LIFETIME = 60000;

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: Array<{ description: string, accept: Record<string, Array<string>> }>;
}

declare global {
	interface Window {
		/* eslint-disable no-unused-vars */
		showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
		/* eslint-enable no-unused-vars */
	}
}

export interface RecordingSinkOptions {
	filename: string;
	mimeType: string;
	extension: string;
	usePicker?: boolean;
}

export interface RecordingSink {
	/* eslint-disable no-unused-vars */
	write(chunk: Blob): void;
	/* eslint-enable no-unused-vars */
	close(): Promise<void>;
}

export interface RecoverableRecording {
	filename: string;
	size: number;
}

interface RecordingMetadata {
	filename: string;
	name: string;
	extension: string;
}

const workerScript = `
let accessHandle;
let offset = 0;

self.onmessage = async ({ data }) => {
	try {
		if (data.type === 'open') {
			const root = await navigator.storage.getDirectory();
			const directory = await root.getDirectoryHandle(data.directory, { create: true });
			const file = await directory.getFileHandle(data.filename, { create: true });

			accessHandle = await file.createSyncAccessHandle();
			accessHandle.truncate(0);
			offset = 0;

			self.postMessage({ type: 'opened' });
		} else if (data.type === 'write') {
			const at = data.position === undefined ? offset : data.position;
			const written = accessHandle.write(new Uint8Array(data.chunk), { at });

			offset = Math.max(offset, at + written);
		} else if (data.type === 'close') {
			accessHandle.flush();
			accessHandle.close();
			accessHandle = undefined;

			self.postMessage({ type: 'closed', size: offset });
		}
	} catch (error) {
		self.postMessage({ type: 'error', message: String(error && error.message ? error.message : error) });
	}
};
`;

const opfsAvailable = (): boolean => typeof navigator.storage?.getDirectory === 'function';

const readStored = <T, >(key: string): T | undefined => {
	try {
		const stored = window.localStorage.getItem(key);

		return stored ? JSON.parse(stored) : undefined;
	} catch (error) {
		logger.debug('readStored() [key:%s, error:%o]', key, error);

		return undefined;
	}
};

const writeStored = (key: string, value?: unknown): void => {
	try {
		if (value === undefined) window.localStorage.removeItem(key);
		else window.localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		logger.error('writeStored() [key:%s, error:%o]', key, error);
	}
};

const fileHandle = async (name: string, create: boolean): Promise<FileSystemFileHandle | undefined> => {
	if (!opfsAvailable()) return undefined;

	try {
		const root = await navigator.storage.getDirectory();
		const directory = await root.getDirectoryHandle(OPFS_DIRECTORY, { create });

		return await directory.getFileHandle(name, { create });
	} catch (error) {
		logger.debug('fileHandle() [name:%s, error:%o]', name, error);

		return undefined;
	}
};

const removeFile = async (name: string): Promise<void> => {
	if (!opfsAvailable()) return;

	try {
		const root = await navigator.storage.getDirectory();
		const directory = await root.getDirectoryHandle(OPFS_DIRECTORY);

		await directory.removeEntry(name);
	} catch (error) {
		logger.debug('removeFile() [name:%s, error:%o]', name, error);
	}
};

const scheduleCleanup = (name: string): void => {
	const pending = readStored<Array<string>>(CLEANUP_KEY) ?? [];

	writeStored(CLEANUP_KEY, [ ...pending, name ]);
};

const runCleanup = async (): Promise<void> => {
	const pending = readStored<Array<string>>(CLEANUP_KEY) ?? [];

	writeStored(CLEANUP_KEY, undefined);

	for (const name of pending) await removeFile(name);
};

const preloadRemux = (): void => {
	import('./recordingRemux').catch((error) => logger.debug('preloadRemux() [error:%o]', error));
};

const persistStorage = async (): Promise<boolean> => {
	if (typeof navigator.storage?.persist !== 'function') return false;

	try {
		if (await navigator.storage.persisted()) return true;

		return await navigator.storage.persist();
	} catch (error) {
		logger.debug('persistStorage() [error:%o]', error);

		return false;
	}
};

export const storageHeadroom = async (): Promise<number | undefined> => {
	if (typeof navigator.storage?.estimate !== 'function') return undefined;

	try {
		const { usage = 0, quota = 0 } = await navigator.storage.estimate();

		return quota - usage;
	} catch (error) {
		logger.debug('storageHeadroom() [error:%o]', error);

		return undefined;
	}
};

class OpfsFile {
	#name: string;
	#workerUrl: string;
	#worker: Worker;
	/* eslint-disable no-unused-vars */
	#pending?: { resolve: () => void, reject: (error: Error) => void };
	/* eslint-enable no-unused-vars */
	public failed = false;

	constructor(name: string) {
		this.#name = name;
		this.#workerUrl = URL.createObjectURL(
			new Blob([ workerScript ], { type: 'application/javascript' })
		);
		this.#worker = new Worker(this.#workerUrl, { name: 'RecordingSink' });

		this.#worker.onmessage = ({ data }) => {
			const pending = this.#pending;

			this.#pending = undefined;

			if (data.type === 'error') {
				this.failed = true;

				logger.error('worker [message:%s]', data.message);
				pending?.reject(new Error(data.message));
			} else {
				pending?.resolve();
			}
		};
	}

	public get name(): string {
		return this.#name;
	}

	public open(): Promise<void> {
		return this.#request({
			type: 'open',
			directory: OPFS_DIRECTORY,
			filename: this.#name
		});
	}

	public send(buffer: ArrayBuffer, position?: number): void {
		this.#worker.postMessage({ type: 'write', chunk: buffer, position }, [ buffer ]);
	}

	public async close(): Promise<void> {
		try {
			await this.#request({ type: 'close' });
		} catch (error) {
			logger.error('close() [name:%s, error:%o]', this.#name, error);
		} finally {
			this.#worker.terminate();
			URL.revokeObjectURL(this.#workerUrl);
		}
	}

	#request(message: Record<string, unknown>): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#pending = { resolve, reject };
			this.#worker.postMessage(message);
		});
	}
}

const opfsWriter = async (name: string): Promise<PositionedWriter & { name: string }> => {
	const target = new OpfsFile(name);
	let queue = Promise.resolve();

	await target.open();

	return {
		name,
		write: (data, position) => {
			const buffer = data.slice().buffer;

			queue = queue.then(() => target.send(buffer, position));

			return queue;
		},
		close: async () => {
			await queue;
			await target.close();
		}
	};
};

const destinationWriter = async (destination: FileSystemFileHandle): Promise<PositionedWriter> => {
	const stream = await destination.createWritable();

	return {
		write: (data, position) => stream.write({ type: 'write', position, data }),
		close: () => stream.close()
	};
};

const downloadFile = (data: Blob, filename: string): void => {
	const url = URL.createObjectURL(data);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME);
};

const savePicker = (options: RecordingSinkOptions): Promise<FileSystemFileHandle> | undefined => {
	if (options.usePicker === false || !window.showSaveFilePicker) return undefined;

	return window.showSaveFilePicker({
		suggestedName: options.filename,
		types: [ {
			description: 'LocalRecording',
			accept: { [recordingContainer(options.mimeType)]: [ `.${options.extension}` ] }
		} ]
	});
};

const copyToDestination = async (file: File, destination: FileSystemFileHandle): Promise<void> => {
	const writable = await destination.createWritable();

	await file.stream().pipeTo(writable as WritableStream<Uint8Array>);
};

const deliverToDestination = async (
	file: File,
	extension: string,
	destination: FileSystemFileHandle
): Promise<void> => {
	try {
		const { remuxRecording } = await import('./recordingRemux');

		await remuxRecording(file, extension, await destinationWriter(destination));
	} catch (error) {
		logger.error('deliverToDestination() [error:%o]', error);

		await copyToDestination(file, destination);
	}
};

const deliverAsDownload = async (file: File, filename: string, extension: string): Promise<void> => {
	const name = `remux-${Date.now()}`;
	const headroom = await storageHeadroom();

	if (headroom !== undefined && headroom < file.size) {
		logger.warn('deliverAsDownload() [headroom:%s, size:%s]', headroom, file.size);

		return downloadFile(file, filename);
	}

	try {
		const { remuxRecording } = await import('./recordingRemux');

		await remuxRecording(file, extension, await opfsWriter(name));

		const handle = await fileHandle(name, false);
		const remuxed = await handle?.getFile();

		if (!remuxed || remuxed.size === 0) throw new Error('remux produced nothing');

		downloadFile(remuxed, filename);
		scheduleCleanup(name);

		return;
	} catch (error) {
		logger.error('deliverAsDownload() [error:%o]', error);

		await removeFile(name);
	}

	downloadFile(file, filename);
};

const deliver = async (
	file: File,
	metadata: RecordingMetadata,
	destination?: FileSystemFileHandle
): Promise<void> => {
	if (destination) {
		await deliverToDestination(file, metadata.extension, destination);
		await removeFile(metadata.name);
	} else {
		await deliverAsDownload(file, metadata.filename, metadata.extension);
		scheduleCleanup(metadata.name);
	}

	writeStored(METADATA_KEY, undefined);
};

class OpfsSink implements RecordingSink {
	#metadata: RecordingMetadata;
	#destination?: FileSystemFileHandle;
	#file: OpfsFile;
	#queue: Promise<void> = Promise.resolve();

	constructor(metadata: RecordingMetadata, destination?: FileSystemFileHandle) {
		this.#metadata = metadata;
		this.#destination = destination;
		this.#file = new OpfsFile(metadata.name);
	}

	public async open(): Promise<void> {
		persistStorage().then((persisted) => logger.debug('open() [persisted:%s]', persisted));
		preloadRemux();

		await runCleanup();
		await this.#file.open();

		writeStored(METADATA_KEY, this.#metadata);
	}

	public write(chunk: Blob): void {
		this.#queue = this.#queue
			.then(async () => {
				const buffer = await chunk.arrayBuffer();

				this.#file.send(buffer);
			})
			.catch((error) => {
				this.#file.failed = true;

				logger.error('write() [error:%o]', error);
			});
	}

	public async close(): Promise<void> {
		await this.#queue;
		await this.#file.close();

		const handle = await fileHandle(this.#metadata.name, false);
		const file = await handle?.getFile();

		if (!file || file.size === 0) {
			writeStored(METADATA_KEY, undefined);
			await removeFile(this.#metadata.name);

			throw new Error('nothing was recorded');
		}

		await deliver(file, this.#metadata, this.#destination);

		if (this.#file.failed) throw new Error('some recorded data was lost');
	}
}

class NativeFileSink implements RecordingSink {
	#stream: FileSystemWritableFileStream;
	#queue: Promise<void> = Promise.resolve();
	#failed = false;

	constructor(stream: FileSystemWritableFileStream) {
		this.#stream = stream;
	}

	public write(chunk: Blob): void {
		this.#queue = this.#queue
			.then(() => this.#stream.write(chunk))
			.catch((error) => {
				this.#failed = true;

				logger.error('write() [error:%o]', error);
			});
	}

	public async close(): Promise<void> {
		await this.#queue;
		await this.#stream.close();

		if (this.#failed) throw new Error('some recorded data was lost');
	}
}

class MemorySink implements RecordingSink {
	#filename: string;
	#chunks: Array<Blob> = [];

	constructor(filename: string) {
		this.#filename = filename;
	}

	public write(chunk: Blob): void {
		this.#chunks.push(chunk);
	}

	public async close(): Promise<void> {
		if (this.#chunks.length === 0) throw new Error('nothing was recorded');

		downloadFile(new Blob(this.#chunks), this.#filename);
		this.#chunks = [];
	}
}

export const createRecordingSink = async (options: RecordingSinkOptions): Promise<RecordingSink> => {
	const destination = await savePicker(options);

	if (opfsAvailable()) {
		try {
			const sink = new OpfsSink({
				filename: options.filename,
				name: `rec-${Date.now()}`,
				extension: options.extension
			}, destination);

			await sink.open();

			logger.debug('createRecordingSink() [sink:opfs, destination:%s]', Boolean(destination));

			return sink;
		} catch (error) {
			logger.error('createRecordingSink() [error:%o]', error);
		}
	}

	if (destination) {
		logger.debug('createRecordingSink() [sink:native]');

		return new NativeFileSink(await destination.createWritable());
	}

	logger.debug('createRecordingSink() [sink:memory]');

	return new MemorySink(options.filename);
};

export const recoverableRecording = async (): Promise<RecoverableRecording | undefined> => {
	const metadata = readStored<RecordingMetadata>(METADATA_KEY);

	if (!metadata?.filename || !metadata.name) return undefined;

	const handle = await fileHandle(metadata.name, false);
	const file = await handle?.getFile();

	if (!file || file.size === 0) {
		writeStored(METADATA_KEY, undefined);

		return undefined;
	}

	return { filename: metadata.filename, size: file.size };
};

export const saveRecoveredRecording = async (): Promise<void> => {
	const metadata = readStored<RecordingMetadata>(METADATA_KEY);

	if (!metadata?.filename || !metadata.name) throw new Error('nothing to recover');

	const extension = metadata.extension || metadata.filename.split('.').pop() || 'mp4';
	const destination = await savePicker({
		filename: metadata.filename,
		mimeType: `video/${extension}`,
		extension
	});
	const handle = await fileHandle(metadata.name, false);
	const file = await handle?.getFile();

	if (!file || file.size === 0) throw new Error('nothing to recover');

	await deliver(file, { ...metadata, extension }, destination);
};

export const discardRecoveredRecording = async (): Promise<void> => {
	const metadata = readStored<RecordingMetadata>(METADATA_KEY);

	writeStored(METADATA_KEY, undefined);

	if (metadata?.name) await removeFile(metadata.name);
};
