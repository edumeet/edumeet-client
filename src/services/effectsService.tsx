/**
 * ML Backend: TF Lite
 * Copyright 2018 Google LLC
 * License: Apache 2.0
 * https://github.com/google-coral/tflite/blob/master/LICENSE
 * 
 * Model: MediaPipe Selfie Segmentation
 * Copyright 2021 Google LLC
 * License: Apache 2.0
 * https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf
 */

import { Logger, timeoutPromise } from 'edumeet-common';
import { BlurBackground, BlurBackgroundNotSupportedError } from '../utils/blurbackground/BlurBackground';
import { deviceInfo } from '../utils/deviceInfo';
import { EventEmitter } from 'events';

const logger = new Logger('EffectsService');

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
	landscape: {
		path: '/model/selfie_segmenter_landscape.tflite',
		width: 256,
		height: 144 },
	square: {
		path: '/model/selfie_segmenter.tflite',
		width: 256,
		height: 256
	}
};

export type StreamType = 'live' | 'preview'

export class EffectService extends EventEmitter {
	#blurBackgroundSupported = true;
	#blurBackgroundEffects = new Map<StreamType, BlurBackground>();
	#model?: ArrayBuffer;
	#liveMLBackend?: TFLite;
	#previewMLBackend?: TFLite;
	#isLoadingMLBackend = false;
	#loadMLBackendTimeout = 10000;
	// eslint-disable-next-line no-unused-vars
	resolveMLBackendReady!: () => void;
	// eslint-disable-next-line no-unused-vars
	rejectMLBackendReady!: (error: Error) => void;
	MLBackendReady = new Promise<void>((resolve, reject) => {
		this.resolveMLBackendReady = resolve;
		this.rejectMLBackendReady = reject;
	});
	#selectedModel = models.landscape;
	webGLSupport?: boolean;

	constructor() {
		logger.debug('constructor()');
		super();

		/**
		 * Don't load MLBackend on mobile.
		 * It's probably not supported and it's 3 MB.
		 */
		if (deviceInfo().platform !== 'mobile') this.#initML();
		else this.#blurBackgroundSupported = false;
	}
	
	async #initML() {
		logger.debug('#initML()');
		if (this.#isLoadingMLBackend)
			return await this.MLBackendReady;
		this.#isLoadingMLBackend = true;
		
		try {
			this.#liveMLBackend = await this.#loadBackend();
			this.#previewMLBackend = await this.#loadBackend();
			this.#model = await this.#loadModel();

			this.resolveMLBackendReady();
		} catch (e) {
			logger.error(e);
			this.rejectMLBackendReady(e as Error); 
		}
	}

	async #loadBackend() {
		// Try if browser has SIMD-support.
		let MLBackend: TFLite | undefined;

		try {
			MLBackend = await timeoutPromise(createTFLiteSIMDModule(), this.#loadMLBackendTimeout);
			if (!MLBackend) throw new Error('No ML Backend');
		} catch (error) {
			logger.error(error);
		}

		// If not, try without SIMD support.
		if (!MLBackend) {
			try {
				MLBackend = await timeoutPromise(createTFLiteModule(), this.#loadMLBackendTimeout);
				if (!MLBackend) throw new Error('No ML Backend');
			} catch (error) {
				logger.error(error);
			} 
		}

		if (!MLBackend) {
			throw new BlurBackgroundNotSupportedError('WASM Not supported by browser');
		}
		
		return MLBackend;
	}

	async #loadModel() {
		logger.debug('#loadModel()');
		const response = await fetch(this.#selectedModel.path);

		if (!response.ok) throw new BlurBackgroundNotSupportedError('Could not load model');

		return await response.arrayBuffer();
	}

	public async startBlurEffect(inputStream: MediaStream, streamType: StreamType) {
		logger.debug('startBlurEffect() [stream.id: %s, streamType: %s, pipeline: %s]', inputStream.id, streamType, this.webGLSupport ? 'webgl' : 'canvas');
		if (!this.#blurBackgroundSupported)
			throw new BlurBackgroundNotSupportedError('Not supported');
		
		await this.MLBackendReady;
		const MLBackend = streamType === 'live' ? this.#liveMLBackend : this.#previewMLBackend;

		if (!MLBackend || !this.#model) throw new BlurBackgroundNotSupportedError('Not supported');
		const effect = new BlurBackground(MLBackend, this.#model);

		const { blurTrack, width, height } = effect.createBlurTrack(inputStream, this.webGLSupport === true, this.#selectedModel.width, this.#selectedModel.height);

		this.#blurBackgroundEffects.set(streamType, effect);		
		
		effect.on('error', () => {
			this.emit('error');
			effect.removeAllListeners();
		});
		
		return { blurTrack, width, height };
	}

	public stopBlurEffect(streamType: StreamType) {
		logger.debug('stopBlurEffect() [streamType: %s]', streamType);
		if (!this.#blurBackgroundSupported)
			throw new BlurBackgroundNotSupportedError('Not supported');
		const effect = this.#blurBackgroundEffects.get(streamType);

		effect?.stopEffect();
		this.#blurBackgroundEffects.delete(streamType);
	}
}
