import { createCanvasPipeline } from './CanvasPipeline';
import { BackgroundConfig, BackgroundEffectPipeline, BackgroundPipelineOptions } from '../types';
import { createWebGLPipeline } from './WebGLPipeline';
import { TFLite, modelConfig } from '../../services/effectsService';
import { Logger } from '../Logger';

const logger = new Logger('EffectTrack');

type workerMessage = {
	timeout: boolean
}

export class EffectBackgroundNotSupportedError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'EffectBackgroundNotSupportedError';

		if (Error.hasOwnProperty('captureStackTrace')) // Only in V8.
			Error.captureStackTrace(this, EffectBackgroundNotSupportedError);
		else
			this.stack = (new Error(message)).stack;
	}
}

export class EffectTrack {
	#backend?: TFLite;
	#model?: ArrayBuffer;
	#stream?: MediaStream;
	#segWidth = 0;
	#segHeight = 0;
	#worker: Worker;
	#pipeline?: BackgroundEffectPipeline;
	#targetFps = 30;
	#timeoutId = 1;
	#useWebGL: boolean;
	public outputTrack: MediaStreamTrack;
	public inputTrack: MediaStreamTrack;

	// HTML elements
	#inputVideo = document.createElement('video');
	#outputCanvas = document.createElement('canvas');

	private constructor(
		backend: TFLite,
		model: ArrayBuffer,
		inputTrack: MediaStreamTrack,
		useWebGL: boolean,
		backgroundConfig: BackgroundConfig,
	) {
		logger.debug('constructor() [inputTrack.id %s, useWebGL: %s', inputTrack.id, useWebGL);
		this.#backend = backend;
		this.#model = model;
		this.#backend.HEAPU8.set(new Uint8Array(this.#model), this.#backend._getModelBufferMemoryOffset());
		this.#backend._loadModel(this.#model.byteLength);
		this.#worker = this.#createWebWorker(backgroundConfig.type);
		this.#useWebGL = useWebGL;
		this.inputTrack = inputTrack;
		this.outputTrack = this.#startEffect(inputTrack, backgroundConfig);
	}

	public static createTrack(backend: TFLite, model: ArrayBuffer, inputTrack: MediaStreamTrack, useWebGL: boolean, backgroundConfig: BackgroundConfig): EffectTrack {
		return new EffectTrack(backend, model, inputTrack, useWebGL, backgroundConfig);
	}

	public async stop() {
		logger.debug('stop()');

		try {
			this.inputTrack.stop();
			this.outputTrack.stop();

			this.#stream = undefined;

			this.#inputVideo.srcObject = null;
			this.#worker.postMessage({ timeoutId: this.#timeoutId });
			this.#worker.terminate();
			this.#pipeline?.cleanup();
		} catch (e) {
			logger.error(e);
		}
	}

	#startEffect(inputTrack: MediaStreamTrack, backgroundConfig: BackgroundConfig) {
		this.#inputVideo = document.createElement('video');
		this.#segWidth = modelConfig.width;
		this.#segHeight = modelConfig.height;

		const { width, height } = inputTrack.getSettings();

		if (!width || !height) throw new Error('Missing track width and/or height');

		const effectTrack = this.#createEffectTrack(inputTrack);

		if (!this.#backend) throw new Error('No ML Backend');

		const pipelineOptions = {
			source: {
				element: this.#inputVideo,
				dimensions: { width, height }
			},
			canvas: this.#outputCanvas,
			backend: this.#backend,
			segmentation: { width: this.#segWidth, height: this.#segHeight },
			backgroundConfig,
		};

		this.#createRenderingPipeline(pipelineOptions);

		this.#inputVideo.onloadeddata = () => {
			this.#render();
			this.#inputVideo.onloadeddata = null;
		};

		return effectTrack;
	}

	#createRenderingPipeline(pipelineOptions: BackgroundPipelineOptions) {
		if (this.#useWebGL) {
			try {
				this.#pipeline = createWebGLPipeline(pipelineOptions);
			} catch (error) {
				logger.error('createWebGLPipeline() %o', error);
			}
		}
		if (!this.#pipeline) {
			try {
				this.#pipeline = createCanvasPipeline(pipelineOptions);
			} catch (error) {
				logger.error('createCanvasPipeline() %o', error);
			}
		}

		if (!this.#pipeline) throw new Error('No rendering pipeline');
	}

	#createWebWorker(effectType: BackgroundConfig['type']): Worker {
		logger.debug('#createWebWorker()');

		const script = `onmessage = function(event) {
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
		};`;

		const worker = new Worker(
			URL.createObjectURL(new Blob([ script ], { type: 'application/javascript' })),
			{ name: `${effectType}BackgroundService` }
		);

		worker.onmessage = (message: MessageEvent<workerMessage>) => {
			if (message.data.timeout) this.#render();
		};

		return worker;
	}

	#createEffectTrack(track: MediaStreamTrack) {
		logger.debug('#createTrack(), [track.id: %s]', track.id);

		const targetFps = track.getSettings().frameRate;

		if (!targetFps) throw new Error('No fps');

		logger.debug('targetFps: %s', targetFps);

		this.#targetFps = targetFps;

		if (!track) throw new Error('No video track');

		const {
			height,
			frameRate,
			width,
		} = track.getSettings ? track.getSettings() : track.getConstraints();

		this.#outputCanvas.width = width as number;
		this.#outputCanvas.height = height as number;
		this.#inputVideo.width = width as number;
		this.#inputVideo.height = height as number;
		this.#inputVideo.autoplay = true;
		this.#stream = new MediaStream();

		this.#stream.addTrack(track);
		this.#inputVideo.srcObject = this.#stream;

		return this.#outputCanvas.captureStream(frameRate as number).getVideoTracks()[0];
	}

	#render() {
		try {
			if (!this.#pipeline) throw new Error('No pipeline');

			const startTime = performance.now();

			this.#pipeline.render();

			this.#worker.postMessage({
				timeoutId: this.#timeoutId,
				timeoutMs: Math.max(0, (1000 / this.#targetFps) - (performance.now() - startTime))
			});

			this.#timeoutId++;

		} catch (error) {
			logger.error('#render() %o', error);

			this.stop();
		}
	}
}
