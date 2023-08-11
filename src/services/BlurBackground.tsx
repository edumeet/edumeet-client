import { EventEmitter } from 'events';

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
  HEAPU8: any
  HEAPF32: any
}
import { Logger, timeoutPromise } from 'edumeet-common';

const logger = new Logger('BlurBackgroundService');

const models = {
	modelLandscape: '/model/selfie_segmentation_landscape.tflite'
};
/* eslint-enable lines-around-comment */

interface BlurBackgroundOptions {
	width: number,
	height: number
}
const WORKER_MSG = Object.freeze({
	SET_TIMEOUT: 'setTimeout',
	CLEAR_TIMEOUT: 'clearTimeout',
	TIMEOUT_TICK: 'timeoutTick'
});

/**
 * Blur background using WASM.
 */
export class BlurBackground extends EventEmitter {
	#backend?: TFLite;
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
	#inputVideo;

	// 2d Contexts
	#segMaskCtx: CanvasRenderingContext2D | null = null;
	#outputCanvasCtx: CanvasRenderingContext2D | null = null;

	constructor() {
		logger.debug('constructor()');
		super();
		this.#inputVideo = document.createElement('video');
	}

	#notSupported() {
		return (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints); 
	}

	async stopEffect() {
		logger.debug('stopEffect()');
		try {
			this.#stream?.getVideoTracks().forEach((t) => t.stop());

			this.#inputVideo.srcObject = null;
			this.#worker?.terminate();
		} catch (e) {
			logger.error(e);
		}
	}

	async startEffect(stream: MediaStream, options: BlurBackgroundOptions) {
		logger.debug('startEffect() [stream.id: %s, options: %o]', stream.id, options);
		if (this.#notSupported()) {
			this.emit('notSupported');
			throw new Error('Not supported');
		}
		const { width, height } = options;

		this.#segWidth = width;
		this.#segHeight = height;
		await this.#loadBackend();

		const trackSettings = stream.getTracks()[0].getSettings();

		this.#outputCanvas.height = trackSettings.height as number;
		this.#outputCanvas.width = trackSettings.width as number;
		this.#segPixelCount = this.#segWidth * this.#segHeight;
		this.#segMask = new ImageData(this.#segWidth, this.#segHeight);
		this.#worker = this.#createWebWorker();
		this.#stream = stream;
		
		return this.#createStream(this.#worker).getVideoTracks()[0];
	}

	async #loadBackend() {
		logger.debug('#loadBackend()');
		// Try if browser support SIMD.
		try {
			this.#backend = await timeoutPromise(createTFLiteSIMDModule(), 1000);
		} catch (error) {
			logger.error(error);
		}

		// Try without SIMD support.
		if (!this.#backend) {
			try {
				this.#backend = await timeoutPromise(createTFLiteModule(), 1000);
			} catch (error) {
				logger.error(error);
			} 
		}

		if (!this.#backend) {
			this.emit('notSupported');
			throw new Error('Not supported');
		}
		if (!this.#model) {
			const modelResponse = await fetch(models.modelLandscape);

			if (!modelResponse.ok) throw new Error('Could not load model');

			this.#model = await modelResponse.arrayBuffer();
			this.#backend.HEAPU8.set(new Uint8Array(this.#model), this.#backend._getModelBufferMemoryOffset());
			this.#backend._loadModel(this.#model.byteLength);
			this.#outputMemoryOffset = this.#backend._getOutputMemoryOffset() / 4;
			this.#inputMemoryOffset = this.#backend._getInputMemoryOffset() / 4;
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
		this.#doResize();
		this.#doInference();
		this.#doPostProcessing();

		worker.postMessage({
			method: WORKER_MSG.SET_TIMEOUT,
			timeMs: 1000 / 30
		});
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
	
		if (!this.#backend || !this.#inputMemoryOffset) throw new Error();
		for (let i = 0; i < this.#segPixelCount; i++) {
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3)] = Number(imageData.data[i * 4] / 255);
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3) + 1] = Number(imageData.data[(i * 4) + 1] / 255);
			this.#backend.HEAPF32[this.#inputMemoryOffset + (i * 3) + 2] = Number(imageData.data[(i * 4) + 2] / 255);
		}
	}

	#doInference() {
		if (!this.#backend) throw new Error('No backend');
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
		if (!this.#outputCanvasCtx) throw new Error('No output canvas context');
		if (!this.#outputCanvas) throw new Error('No output canvas');

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