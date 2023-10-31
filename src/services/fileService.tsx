import { Logger } from 'edumeet-common';
import type WebTorrent from 'webtorrent';

const logger = new Logger('FileService');

export class FileService {
	private webTorrent?: WebTorrent.Instance;
	// private tracker = getTrackerUrl();

	public getTorrent(magnetURI: string) {
		return this.webTorrent?.get(magnetURI) || undefined;
	}

	public async init(
		iceServers?: RTCIceServer[]
	): Promise<void> {
		logger.debug('init()');

		const Torrent = await import('webtorrent');

		this.webTorrent = new Torrent.default({
			tracker: {
				rtcConfig: {
					iceServers: iceServers
				}
			},
		});
	}

	public async sendFiles(files: FileList): Promise<string> {
		return new Promise((resolve) => {
			this.webTorrent?.seed(
				files,
				{ /* TODO: announceList: [ [ this.tracker ] ] */ },
				(newTorrent) => resolve(newTorrent.magnetURI)
			);
		});
	}

	public async downloadFile(magnetURI: string): Promise<WebTorrent.Torrent> {
		const existingTorrent = this.webTorrent?.get(magnetURI);

		if (existingTorrent)
			return existingTorrent;

		return new Promise((resolve) => {
			this.webTorrent?.add(magnetURI, (torrent) => {
				return resolve(torrent);
			});
		});
	}
}