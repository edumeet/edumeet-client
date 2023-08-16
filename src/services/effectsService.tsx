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
import { BlurBackground, BlurBackgroundNotSupportedError } from './BlurBackground';

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

export type StreamType = 'live' | 'preview'

export class EffectService {
	#blurBackgroundEffects = new Map<StreamType, BlurBackground>();
	#model?: ArrayBuffer
	#liveBackend?: TFLite
	#previewBackend?: TFLite
	#loadingBackend = false;
	// eslint-disable-next-line no-unused-vars
	resolveBackendReady!: () => void;
	// eslint-disable-next-line no-unused-vars
	rejectBackendReady!: (e: Error) => void;
	backendReady = new Promise<void>((resolve, reject) => {
		this.resolveBackendReady = resolve;
		this.rejectBackendReady = reject;
	});

	constructor() {
		this.#initML()
	}
	
	async #initML() {
		logger.debug('#loadMLBackend()');
		if (this.#loadingBackend) {
			await this.backendReady
			return
		} else this.#loadingBackend = true
		
		try {
			this.#liveBackend = await this.#loadBackend()
			this.#previewBackend = await this.#loadBackend()
			this.#model = await this.#loadModel()

			this.resolveBackendReady();
		} catch (e) {
			logger.error(e);
			this.rejectBackendReady(e as Error); 
		}
	}

	async #loadBackend() {
		// Try if browser support SIMD.
		let backend: TFLite | undefined
		try {
			backend = await timeoutPromise(createTFLiteSIMDModule(), 3000);
			if (!backend) throw new Error()
		} catch (error) {
			logger.error(error);
		}

		// If not, try without SIMD support.
		if (!backend) {
			try {
				backend = await timeoutPromise(createTFLiteModule(), 3000);
				if (!backend) throw new Error()
			} catch (error) {
				logger.error(error);
			} 
		}

		if (!backend) {
			throw new BlurBackgroundNotSupportedError('WASM Not supported by browser');
		}
		return backend
	}

	async #loadModel() {
		const response = await fetch(models.modelGeneral.path);
		if (!response.ok) throw new BlurBackgroundNotSupportedError('Could not load model');

		return await response.arrayBuffer()
	}

	public async startBlurEffect(
		stream: MediaStream,
		streamType: StreamType,
		width?: number,
		height?: number) {
		logger.debug('startBlurEffect() [stream.id: %s, streamType: %s width: %s, height: %s]', stream.id, streamType, width, height);
		await this.backendReady

		const backend = streamType === "live" ? this.#liveBackend : this.#previewBackend
		const model = this.#model
		if (!backend || !model) throw new BlurBackgroundNotSupportedError("Not supported")
		const effect = new BlurBackground(backend, model);

		const track = await effect.startEffect(stream,models.modelGeneral.width, models.modelGeneral.height);

		this.#blurBackgroundEffects.set(streamType, effect);		
		
		return track;
	}

	public stopBlurEffect(streamType: StreamType) {
		const effect = this.#blurBackgroundEffects.get(streamType);

		effect?.stopEffect();
		this.#blurBackgroundEffects.delete(streamType);
	}
}
