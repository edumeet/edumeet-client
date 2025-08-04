import type WebTorrent from 'webtorrent';
import { Logger } from '../utils/Logger';

const logger = new Logger('FileService');

export type LocalTorrentFile = WebTorrent.TorrentFile & {
  blob:() => Promise<Blob>;
};

export type LocalWebTorrent = WebTorrent.Torrent & {
  files?: LocalTorrentFile[];
};

export class FileService {
	private webTorrent?: WebTorrent.Instance;
	public tracker?: string;
	public maxFileSize: number = 100_000_000; 
	public iceServers: RTCIceServer[] = [];
	private initialized = false;

	public async getTorrent(magnetURI: string) {
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
				this.tracker ? { announceList: [ [ this.tracker ] ], private: true } : undefined,
				(newTorrent) => resolve(newTorrent.magnetURI)
			);
		});
	}

	public async downloadFile(magnetURI: string): Promise<LocalWebTorrent | undefined > {
		await this.init();

		// Await!
		const existingTorrent = await this.webTorrent?.get(magnetURI);
		
		if (existingTorrent)
			return existingTorrent as LocalWebTorrent; 

		return new Promise((resolve) => {
			return resolve(this.webTorrent?.add(magnetURI) as LocalWebTorrent);
		});
	}
	public async removeFile(magnetURI: string): Promise<LocalWebTorrent | undefined > {
		if (!this.initialized) return;
		if (await this.getTorrent(magnetURI))
			this.webTorrent?.remove(magnetURI);
				
	}
	
	public async removeFiles(): Promise<LocalWebTorrent | undefined > {
		if (!this.initialized) return;
		if (this.webTorrent?.torrents) {
			for (const element of this.webTorrent?.torrents) {
				this.webTorrent?.remove(element);
			}
		}
	}

}
