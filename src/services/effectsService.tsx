import EventEmitter from 'events';
import type { BodyPix } from '@tensorflow-models/body-pix';
import { EffectsTrack } from '../utils/EffectsTrack';

/**
 * A service that handles tensorflow and mediapipe effects on the video stream, and RNNoise on the audio stream.
 */
export class EffectsService extends EventEmitter {
	private bodyPix?: BodyPix;
	private effectTracks = new Map<string, EffectsTrack>();

	public async applyEffect(track: MediaStreamTrack): Promise<MediaStreamTrack> {
		if (track.kind !== 'video')
			throw new Error('Audio effects are not yet implemented.');

		if (!this.bodyPix) await this.loadSegmenter();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const effectTrack = new EffectsTrack(this.bodyPix!, track);

		this.effectTracks.set(effectTrack.outputTrack.id, effectTrack);

		return effectTrack.outputTrack;
	}

	public stop(trackId?: string): void {
		if (trackId) {
			const track = this.effectTracks.get(trackId);

			if (track) {
				track.stop();
				this.effectTracks.delete(trackId);
			}
		} else {
			this.effectTracks.forEach((track) => track.stop());

			this.effectTracks.clear();
		}
	}

	private async loadSegmenter() {
		/* const tfjs = await import('@tensorflow/tfjs');
		const tfjsWasm = await import('@tensorflow/tfjs-backend-wasm');

		tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);

		await tfjs.setBackend('wasm'); */

		await import('@tensorflow/tfjs-backend-webgl');

		const bodyPix = await import('@tensorflow-models/body-pix');

		this.bodyPix = await bodyPix.load();
	}
}