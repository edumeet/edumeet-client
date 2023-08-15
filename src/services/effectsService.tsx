import { Logger } from 'edumeet-common';
import { BlurBackground } from './BlurBackground';

const logger = new Logger('EffectsService');

export type StreamType = 'live' | 'preview'

export class EffectService {
	#blurBackgroundEffects = new Map<StreamType, BlurBackground>();

	public async startBlurEffect(
		stream: MediaStream,
		streamType: StreamType,
		width?: number,
		height?: number) {
		logger.debug('startBlurEffect() [stream.id: %s, streamType: %s width: %s, height: %s]', stream.id, streamType, width, height);

		const effect = new BlurBackground();

		await effect.loadBackend();
		const track = await effect.startEffect(stream, width, height);

		this.#blurBackgroundEffects.set(streamType, effect);		
		
		return track;
	}

	public stopBlurEffect(streamType: StreamType) {
		const effect = this.#blurBackgroundEffects.get(streamType);

		effect?.stopEffect();
		this.#blurBackgroundEffects.delete(streamType);
	}
}
