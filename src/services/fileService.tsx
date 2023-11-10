import { Logger } from 'edumeet-common';
import type WebTorrent from 'webtorrent';

const logger = new Logger('FileService');

export class FileService {
	private webTorrent?: WebTorrent.Instance;
	public tracker?: string;
	public iceServers: RTCIceServer[] = [];
	private initialized = false;

	public getTorrent(magnetURI: string) {
		return this.webTorrent?.get(magnetURI) || undefined;
	}

	private async init(): Promise<void> {
		if (this.initialized) return;

		logger.debug('init()');

		this.initialized = true;

		const Torrent = await import('webtorrent');

		this.webTorrent = new Torrent.default({
			tracker: {
				rtcConfig: {
					iceServers: this.iceServers,
				}
			},
		});
	}

	public async sendFiles(files: FileList): Promise<string> {
		await this.init();

		return new Promise((resolve) => {
			this.webTorrent?.seed(
				files,
				this.tracker ? { announceList: [ [ this.tracker ] ] } : undefined,
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