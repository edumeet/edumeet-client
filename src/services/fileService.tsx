import { Logger } from 'edumeet-common';
import WebTorrent from 'webtorrent';
import { SignalingService } from './signalingService';

const logger = new Logger('FileService');

export class FileService {
	private signalingService: SignalingService;
	private webTorrent?: WebTorrent.Instance;
	// private tracker = getTrackerUrl();

	constructor({ signalingService }: { signalingService: SignalingService }) {
		this.signalingService = signalingService;
	}

	public getTorrent(magnetURI: string): WebTorrent.Torrent | undefined {
		return this.webTorrent?.get(magnetURI) || undefined;
	}

	public async init(
		iceServers?: RTCIceServer[]
	): Promise<void> {
		logger.debug('init()');

		this.webTorrent = new WebTorrent({
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