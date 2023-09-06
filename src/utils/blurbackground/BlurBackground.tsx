import { Logger } from 'edumeet-common';
import { TFLite } from '../../services/effectsService';
import { createCanvasPipeline } from './canvasPipeline';
import { BlurBackgroundPipeline } from '../types';
import { createWebGLPipeline } from './webglPipeline';

const logger = new Logger('BlurBackground');

type workerMessage = {
	timeout: boolean
}

export class BlurBackgroundNotSupportedError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'BlurBackgroundNotSupportedError';

		if (Error.hasOwnProperty('captureStackTrace')) // Just in V8.
			Error.captureStackTrace(this, BlurBackgroundNotSupportedError);
		else
			this.stack = (new Error(message)).stack;
	}
}

export class BlurBackground {
	#backend?: TFLite;
	#model?: ArrayBuffer;
	#stream?: MediaStream;
	#segWidth = 0;
	#segHeight = 0;
	#worker: Worker;
	#pipeline?: BlurBackgroundPipeline;
	#targetFps = 30;
	#timeoutId = 1;

	// HTML elements
	#inputVideo = document.createElement('video');
	#outputCanvas = document.createElement('canvas');

	constructor(backend: TFLite, model: ArrayBuffer) {
		this.#backend = backend;
		this.#model = model;
		this.#backend.HEAPU8.set(new Uint8Array(this.#model), this.#backend._getModelBufferMemoryOffset());
		this.#backend._loadModel(this.#model.byteLength);
		this.#worker = this.#createWebWorker();
	}

	public async stopEffect() {
		logger.debug('stopEffect()');
		try {
			this.#stream?.getVideoTracks().forEach((t) => t.stop());
			this.#inputVideo.srcObject = null;
			this.#worker.postMessage({ timeoutId: this.#timeoutId });
			this.#worker.terminate();
			this.#pipeline?.cleanup();
		} catch (e) {
			logger.error(e);
		}
	}

	createBlurTrack(
		inputStream: MediaStream, webGlSupport: boolean, modelWidth: number, modelHeight: number
	) {
		logger.debug('startEffect() [inputStream.id: %s, modelWidth: %s, modelHeight: %s]', inputStream.id, modelWidth, modelHeight);
		this.#inputVideo = document.createElement('video');
		this.#segWidth = modelWidth;
		this.#segHeight = modelHeight;

		let width, height;

		({ width, height } = inputStream.getTracks()[0].getSettings());

		if (!width || !height) throw new Error('Missing track width and/or height');

		this.#stream = inputStream;

		const blurTrack = this.#createBlurStream().getVideoTracks()[0];

		if (!this.#backend) throw new Error('No ML Backend');
		const pipelineOptions = { source: {
			element: this.#inputVideo,
			dimensions: { width, height }
		},
		canvas: this.#outputCanvas,
		backend: this.#backend,
		segmentation: { width: this.#segWidth, height: this.#segHeight }
		};

		webGlSupport ?
			this.#pipeline = createCanvasPipeline(pipelineOptions) :
			this.#pipeline = createWebGLPipeline(pipelineOptions);

		const { width: trackWidth, height: trackHeight } = blurTrack.getSettings();

		if (trackWidth && trackHeight) {
			width = trackWidth;
			height = trackHeight;
		}
		
		this.#inputVideo.onloadeddata = () => {
			this.#render();
			this.#inputVideo.onloadeddata = null;
		};

		return {
			blurTrack,
			width: width,
			height: height
		};
	}

	#createWebWorker(): Worker {
		logger.debug('#createWebWorker()');
		const script = `
	onmessage = function(event) {
		const timeoutIds = new Map();

		if (event.data.timeoutMs !== undefined) {
			const timeoutId = setTimeout(() => {
				postMessage({ timeout: true });
				timeoutIds.delete(event.data.timeoutId)
			}, event.data.timeoutMs);
			timeoutIds.set(event.data.timeoutId, timeoutId)
		} else {
			const id = timeoutIds.get(event.data.timeoutId)
			clearTimeout(id)
			timeoutIds.clear()
		}
		};
	`;

		const worker = new Worker(
			URL.createObjectURL(new Blob([ script ], { type: 'application/javascript' })),
			{ name: 'BlurBackgroundService' }
		);

		worker.onmessage = (message: MessageEvent<workerMessage>) => {
			if (message.data.timeout) this.#render();
		};
		
		return worker;
	}

	#createBlurStream() {
		logger.debug('#createStream(), [stream.id: %s]', this.#stream?.id);
		if (!this.#stream) throw new Error('No MediaStream');
		const track = this.#stream?.getVideoTracks()[0];

		const targetFps = track.getSettings().frameRate;

		if (!targetFps) throw new Error('No fps');
		logger.debug('targetFps: %s', targetFps);
		this.#targetFps = targetFps;

		if (!track) throw new Error('No video track');
		const { height, frameRate, width }
            = track.getSettings ? track.getSettings() : track.getConstraints();

		this.#outputCanvas.width = width as number;
		this.#outputCanvas.height = height as number;
		this.#inputVideo.width = width as number;
		this.#inputVideo.height = height as number;
		this.#inputVideo.autoplay = true;
		this.#inputVideo.srcObject = this.#stream;

		return this.#outputCanvas.captureStream(frameRate as number);
	}

	#render() {
		if (!this.#pipeline) throw new Error('No pipeline');
		const startTime = performance.now();

		this.#pipeline.render();

		this.#worker.postMessage({
			timeoutId: this.#timeoutId,
			timeoutMs: Math.max(0, (1000 / this.#targetFps) - (performance.now() - startTime))
		});
		this.#timeoutId++;
	}
}