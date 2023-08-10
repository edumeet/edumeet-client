import { EventEmitter } from 'events';

import createTFLiteModule from './lib/tflite/tflite';
import createTFLiteSIMDModule from './lib/tflite/tflite-simd';
import { Logger, timeoutPromise } from 'edumeet-common';

const logger = new Logger('BlurBackgroundService');

const models = {
	modelLandscape: 'lib/model/selfie_segmentation_landscape.tflite'
};
/* eslint-enable lines-around-comment */

interface BlurBackgroundOptions {
	width: number,
	height: number
}
const WORKER_MSG = Object.freeze({
	SET_TIMEOUT: 'setTimeout',
	CLEAR_TIMEOUT: 'clear',
	TIMEOUT_TICK: 'timeoutTick'
});

/**
 * Blur background using WASM.
 */
export class BlurBackgroundService extends EventEmitter {
	#model?: any;
	#buffer?: ArrayBuffer;
	#stream?: MediaStream;
	#segMask?: ImageData;
	#width = 0;
	#height = 0;
	#segPixelCount = 0;

	// HTML elements
	#segMaskCanvas = document.createElement('canvas');
	#outputCanvas = document.createElement('canvas');
	#input;

	// 2d Contexts
	#segMaskCtx: CanvasRenderingContext2D | null = null;
	#outputCanvasCtx: CanvasRenderingContext2D | null = null;

	constructor() {
		super();
		this.#input = document.createElement('video');
	}

	#notSupported() {
		return (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints); 
	}

	async blurBackground(stream: MediaStream, options: BlurBackgroundOptions) {
		if (this.#notSupported()) {
			this.emit('notSupported');
			throw new Error('Not supported');
		}
		await this.#loadModel();
		const { width, height } = options;

		this.#width = width;
		this.#height = height;
		this.#segPixelCount = width * height;

		this.#segMask = new ImageData(width, height);
		const worker = this.#createWebWorker();

		return this.#createStream(stream, worker);
	}

	async #loadModel() {
		// Try if browser support SIMD.
		try {
			this.#model = await timeoutPromise(createTFLiteSIMDModule(), 1000);
		} catch (error) {
			logger.error(error);
		}

		// Try without SIMD support.
		if (!this.#model) {
			try {
				this.#model = await timeoutPromise(createTFLiteModule(), 1000);
			} catch (error) {
				logger.error(error);
			} 
		}

		if (!this.#model) {
			this.emit('notSupported');
			throw new Error('Not supported');
		}
		if (!this.#buffer) {
			const model = await fetch(models.modelLandscape);
	
			if (!model.ok) {
				throw new Error('Downloading model failed');
			}
	
			this.#buffer = await model.arrayBuffer();
	
			this.#model.HEAPU8.set(new Uint8Array(this.#buffer), this.#model._getModelBufferMemoryOffset());
	
			this.#model._loadModel(this.#buffer.byteLength);
		}
	}

	#createWebWorker(): Worker {
		const script = `
    var timer;

    onmessage = function(message) {
        switch (message.data.method) {
			case clearTimeout: {
				if (timer) {
					clearTimeout(timer);
				}
				break;
			}
			case setTimeout: {
				timer = setTimeout(() => {
					postMessage({ id: timeoutTick });
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

	#createStream(stream: MediaStream, worker: Worker) {
		const track = this.#stream?.getVideoTracks()[0];

		if (!track) throw new Error('No video track');
		const { height, frameRate, width }
            = track.getSettings ? track.getSettings() : track.getConstraints();

		this.#segMaskCanvas = document.createElement('canvas');
		this.#segMaskCanvas.width = this.#width;
		this.#segMaskCanvas.height = this.#height;
		this.#segMaskCtx = this.#segMaskCanvas.getContext('2d');

		this.#outputCanvas.width = parseInt(width as string, 10);
		this.#outputCanvas.height = parseInt(height as string, 10);
		this.#outputCanvasCtx = this.#outputCanvas.getContext('2d');
		this.#input.width = parseInt(width as string, 10);
		this.#input.height = parseInt(height as string, 10);
		this.#input.autoplay = true;
		this.#input.srcObject = stream;
		this.#input.onloadeddata = () => {
			worker.postMessage({
				method: WORKER_MSG.SET_TIMEOUT,
				timeMs: 1000 / 30
			});
		};

		return this.#outputCanvas.captureStream(parseInt(frameRate as string, 10));
	}
	
	#renderSegMask(worker: Worker) {
		this.resize();
		this.inference();
		this.postProcess();

		worker.postMessage({
			method: WORKER_MSG.SET_TIMEOUT,
			timeMs: 1000 / 30
		});
	}

	resize() {
		this.#segMaskCtx?.drawImage( 
			this.#input,
			0,
			0,
			this.#input.width,
			this.#input.height,
			0,
			0,
			this.#width,
			this.#height
		);

		const imageData = this.#segMaskCtx?.getImageData(
			0,
			0,
			this.#width,
			this.#height
		);
		const inputMemoryOffset = this.#model._getInputMemoryOffset() / 4;

		for (let i = 0; i < this.#segPixelCount; i++) {
			this.#model.HEAPF32[inputMemoryOffset + (i * 3)] = Number(imageData?.data[i * 4]) / 255;
			this.#model.HEAPF32[inputMemoryOffset + (i * 3) + 1] = Number(imageData?.data[(i * 4) + 1]) / 255;
			this.#model.HEAPF32[inputMemoryOffset + (i * 3) + 2] = Number(imageData?.data[(i * 4) + 2]) / 255;
		}
	}

	inference() {
		this.#model._runInference();
		const outputMemoryOffset = this.#model._getOutputMemoryOffset() / 4;

		if (!this.#segMask) throw new Error('No segmentation mask');
		for (let i = 0; i < this.#segPixelCount; i++) {
			const person = this.#model.HEAPF32[outputMemoryOffset + i];

			// Sets only the alpha component of each pixel.
			this.#segMask.data[(i * 4) + 3] = 255 * person;

		}
		this.#segMaskCtx?.putImageData(this.#segMask, 0, 0);
	}

	postProcess() {
		const track = this.#stream?.getVideoTracks()[0];

		if (!track) throw new Error('No video track');
		const { height, width } = track.getSettings() ?? track.getConstraints();

		if (!this.#outputCanvasCtx || !this.#outputCanvas) {
			return;
		}

		this.#outputCanvas.height = height as number;
		this.#outputCanvas.width = width as number;
		this.#outputCanvasCtx.globalCompositeOperation = 'copy';

		this.#outputCanvasCtx.filter = 'blur(8px)';
		this.#outputCanvasCtx?.drawImage(
			this.#segMaskCanvas,
			0,
			0,
			this.#width,
			this.#height,
			0,
			0,
			this.#input.width,
			this.#input.height
		);
		this.#outputCanvasCtx.globalCompositeOperation = 'source-in';
		this.#outputCanvasCtx.filter = 'none';

		// Draw the foreground video.
		this.#outputCanvasCtx?.drawImage(this.#input, 0, 0);

		// Draw the background.
		this.#outputCanvasCtx.globalCompositeOperation = 'destination-over';
		this.#outputCanvasCtx.filter = 'blur(8px)';
		this.#outputCanvasCtx?.drawImage(this.#input, 0, 0);
	}
}