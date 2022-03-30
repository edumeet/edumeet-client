import EventEmitter from 'events';
import { Logger } from '../utils/logger';

const logger = new Logger('MediaService');

export class MediaService extends EventEmitter {
	private tracks: Map<string, MediaStreamTrack> = new Map();

	public getTrack(trackId: string): MediaStreamTrack | undefined {
		return this.tracks.get(trackId);
	}

	public addTrack(track: MediaStreamTrack) {
		logger.debug('addTrack() [trackId:%s]', track.id);

		this.tracks.set(track.id, track);

		track.addEventListener('ended', () => {
			logger.debug('addTrack() | track "ended" [trackId:%s]', track.id);

			this.tracks.delete(track.id);

			this.emit('trackEnded', track);
		});

		this.emit('trackAdded', track);
	}
}