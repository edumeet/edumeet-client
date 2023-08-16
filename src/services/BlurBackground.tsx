/**
 * ML Backend: TF Lite
 * Copyright 2018 Google LLC
 * License: Apache 2.0
 * https://github.com/google-coral/tflite/blob/master/LICENSE
 * 
 * Model: MediaPipe Selfie Segmentation
 * Copyirhgt 2021 Google LLC
 * License: Apache 2.0
 * https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf
 */

import { Logger, timeoutPromise } from 'edumeet-common';

declare function createTFLiteModule(): Promise<TFLite>
declare function createTFLiteSIMDModule(): Promise<TFLite>

export interface TFLite {
  _getModelBufferMemoryOffset(): number
  _getInputMemoryOffset(): number
  _getInputHeight(): number
  _getInputWidth(): number
  _getInputChannelCount(): number
  _getOutputMemoryOffset(): number
  _getOutputHeight(): number
  _getOutputWidth(): number
  _getOutputChannelCount(): number
  // eslint-disable-next-line no-unused-vars
  _loadModel(bufferSize: number): number
  _runInference(): number
  /* eslint-disable @typescript-eslint/no-explicit-any */
  HEAPU8: any
  HEAPF32: any
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const models = {
	modelLandscape: {
		path: '/model/selfie_segmenter_landscape.tflite',
		width: 256,
		height: 144 },
	modelGeneral: {
		path: '/model/selfie_segmenter.tflite',
		width: 256,
		height: 256
	}
};

const WORKER_MSG = Object.freeze({
	SET_TIMEOUT: 'setTimeout',
	CLEAR_TIMEOUT: 'clearTimeout',
	TIMEOUT_TICK: 'timeoutTick'
});
const logger = new Logger('BlurBackground');

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

/**
 * Blur background using WASM.
 */
export class BlurBackground {
	#backend?: TFLite;
	#loadingBackend = false;
	// eslint-disable-next-line no-unused-vars
	resolveBackendReady!: () => void;
	// eslint-disable-next-line no-unused-vars
	rejectBackendReady!: (e: Error) => void;
	backendReady = new Promise<void>((resolve, reject) => {
		this.resolveBackendReady = resolve;
		this.rejectBackendReady = reject;
	});
	#model?: ArrayBuffer;
	#stream?: MediaStream;
	#segMask?: ImageData;
	#segWidth = 0;
	#segHeight = 0;
	#segPixelCount = 0;
	#outputMemoryOffset?: number;
	#inputMemoryOffset?: number;
	#worker?: Worker;

	// HTML elements
	#segMaskCanvas = document.createElement('canvas');
	#outputCanvas = document.createElement('canvas');
	#inputVideo = document.createElement('video');

	// 2d Contexts
	#segMaskCtx: CanvasRenderingContext2D | null = null;
	#outputCanvasCtx: CanvasRenderingContext2D | null = null;

	public async stopEffect() {
		logger.debug('stopEffect()');
		try {
			this.#stream?.getVideoTracks().forEach((t) => t.stop());

			this.#inputVideo.srcObject = null;
			this.#worker?.terminate();
			this.#worker = undefined;
		} catch (e) {
			logger.error(e);
		}
	}

	public async loadBackend() {
		if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints)
			throw new BlurBackgroundNotSupportedError('MediaStreamTrack.getSettings() and MediaStreamTrack.getConstraints() not supported');
		if (!this.#loadingBackend) {
			this.#loadBackend();
			this.#loadingBackend = true;
		}
		await this.backendReady;
	}

	async startEffect(
		stream: MediaStream,
		width = models.modelGeneral.width,
		height = models.modelGeneral.height) {
		logger.debug('startEffect() [stream.id: %s, width: %s, height: %s]', stream.id, width, height);
		this.#inputVideo = document.createElement('video');
		this.#segWidth = width;
		this.#segHeight = height;

		const trackSettings = stream.getTracks()[0].getSettings();

		this.#outputCanvas.height = trackSettings.height as number;
		this.#outputCanvas.width = trackSettings.width as number;
		this.#segPixelCount = this.#segWidth * this.#segHeight;
		this.#segMask = new ImageData(this.#segWidth, this.#segHeight);
		if (!this.#worker) this.#worker = this.#createWebWorker();
		this.#stream = stream;
		
		return this.#createStream(this.#worker).getVideoTracks()[0];
	}

	async #loadBackend() {
		logger.debug('#loadBackend()');
		try {
		// Try if browser support SIMD.
			try {
				this.#backend = await timeoutPromise(createTFLiteSIMDModule(), 1000);
			} catch (error) {
				logger.error(error);
			}

			// If not, try without SIMD support.
			if (!this.#backend) {
				try {
					this.#backend = await timeoutPromise(createTFLiteModule(), 1000);
				} catch (error) {
					logger.error(error);
				} 
			}

			if (!this.#backend) {
				throw new BlurBackgroundNotSupportedError('WASM Not supported by browser');
			}
			if (!this.#model) {
				const modelResponse = await fetch(models.modelGeneral.path);

				if (!modelResponse.ok) throw new Error('Could not load model');

				this.#model = await modelResponse.arrayBuffer();
				this.#backend.HEAPU8.set(new Uint8Array(this.#model), this.#backend._getModelBufferMemoryOffset());
				this.#backend._loadModel(this.#model.byteLength);
				this.#outputMemoryOffset = this.#backend._getOutputMemoryOffset() / 4;
				this.#inputMemoryOffset = this.#backend._getInputMemoryOffset() / 4;
			}
			this.resolveBackendReady();
		} catch (e) {
			logger.error(e);
			this.rejectBackendReady(e as Error); 
		}
	}

	#createWebWorker(): Worker {
		logger.debug('#createWebWorker()');
		const script = `
    var timer;

    onmessage = function(message) {
        switch (message.data.method) {
			case "clearTimeout": {
				if (timer) {
					clearTimeout(timer);
				}
				break;
			}
			case "setTimeout": {
				timer = setTimeout(() => {
					postMessage({ method: "timeoutTick" });
				}, message.data.timeMs);
				break;
				}
			}
		};
	`;

		const worker = new Worker(
			URL.createObjectURL(new Blob([ script ], { type: 'application/javascript' })),
			{ name: 'BlurBackgroundService' }
		);

		worker.onmessage = (message) => {
			if (message.data.method === WORKER_MSG.TIMEOUT_TICK) {
				this.#renderSegMask(worker);
			} 
		};
		
		return worker;
	}

	#createStream(worker: Worker) {
		logger.debug('#createStream(), [stream.id: %s, worker: %o]', this.#stream?.id, worker);
		if (!this.#stream) throw new Error('No MediaStream');
		const track = this.#stream?.getVideoTracks()[0];

		if (!track) throw new Error('No video track');
		const { height, frameRate, width }
            = track.getSettings ? track.getSettings() : track.getConstraints();

		this.#segMaskCanvas = document.createElement('canvas');
		this.#segMaskCanvas.width = this.#segWidth;
		this.#segMaskCanvas.height = this.#segHeight;
		this.#segMaskCtx = this.#segMaskCanvas.getContext('2d', { willReadFrequently: true });

		this.#outputCanvas.width = width as number;
		this.#outputCanvas.height = height as number;
		this.#outputCanvasCtx = this.#outputCanvas.getContext('2d', { willReadFrequently: true });
		this.#inputVideo.width = width as number;
		this.#inputVideo.height = height as number;
		this.#inputVideo.autoplay = true;
		this.#inputVideo.srcObject = this.#stream;
		this.#inputVideo.onloadeddata = () => {
			worker.postMessage({
				method: WORKER_MSG.SET_TIMEOUT,
				timeMs: 1000 / 30
			});
		};

		return this.#outputCanvas.captureStream(frameRate as number);
	}
	
	#renderSegMask(worker: Worker) {
		try {
			this.#doResize();
			this.#doInference();
			this.#doPostProcessing();

			worker.postMessage({
				method: WORKER_MSG.SET_TIMEOUT,
				timeMs: 1000 / 30
			});
		} catch (e) {
			logger.error(e);
		}
	}
	#doResize() {
		if (!this.#segMask) throw new Error('No segmentation mask');
		if (!this.#segMaskCtx) throw new Error('No segmentation mask context');
		this.#segMaskCtx.drawImage(
			this.#inputVideo,
			0,
			0,
			this.#inputVideo.width,
			this.#inputVideo.height,
			0,
			0,
			this.#segWidth,
			this.#segHeight
		);
	
		const imageData = this.#segMaskCtx.getImageData(
			0,
			0,
			this.#segWidth,
			this.#segHeight);
	
		if (!this.#backend || !this.#inputMemoryOffset) throw new Error('No ML backend');
		for (let i = 0; i < this.#segPixelCount; i++) {
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3)] = Number(imageData.data[i * 4] / 255);
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3) + 1] = Number(imageData.data[(i * 4) + 1] / 255);
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3) + 2] = Number(imageData.data[(i * 4) + 2] / 255);
		}
	}

	#doInference() {
		if (!this.#backend) throw new Error('No ML backend');
		if (!this.#outputMemoryOffset) throw new Error('No output memory offset');
		this.#backend._runInference();

		if (!this.#segMask) throw new Error('No segmentation mask');
		for (let i = 0; i < this.#segPixelCount; i++) {
			const person = this.#backend.HEAPF32[this.#outputMemoryOffset + i];

			this.#segMask.data[(i * 4) + 3] = 255 * person;
		}
		if (!this.#segMaskCtx) throw new Error('No segmentation mask context');
		this.#segMaskCtx.putImageData(this.#segMask, 0, 0);
	}

	#doPostProcessing() {
		if (!this.#outputCanvasCtx) throw new Error('No output context');
		if (!this.#outputCanvas) throw new Error('No output canvas-element');

		this.#outputCanvasCtx.globalCompositeOperation = 'copy';
		this.#outputCanvasCtx.filter = 'blur(8px)';
		this.#outputCanvasCtx.drawImage(
			this.#segMaskCanvas,
			0,
			0,
			this.#segWidth,
			this.#segHeight,
			0,
			0,
			this.#inputVideo.width,
			this.#inputVideo.height
		);
		this.#outputCanvasCtx.globalCompositeOperation = 'source-in';
		this.#outputCanvasCtx.filter = 'none';

		// Draw the foreground video.
		this.#outputCanvasCtx.drawImage(this.#inputVideo, 0, 0);

		// Draw the background.
		this.#outputCanvasCtx.globalCompositeOperation = 'destination-over';
		this.#outputCanvasCtx.filter = 'blur(8px)';
		this.#outputCanvasCtx.drawImage(this.#inputVideo, 0, 0);
	}
}