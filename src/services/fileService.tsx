import createTorrent from 'create-torrent';
import WebTorrent from 'webtorrent';
import { Logger } from '../utils/logger';
import { SignalingService } from './signalingService';

const logger = new Logger('FileService');

export class FileService {
	private signalingService: SignalingService;
	private webTorrent?: WebTorrent.Instance;
	private tracker = 'wss://tracker.bittorrent.am:443/announce';

	constructor({ signalingService }: { signalingService: SignalingService }) {
		this.signalingService = signalingService;

		this.handleSignaling();
	}

	public getTorrent(magnetURI: string): WebTorrent.Torrent | undefined {
		return this.webTorrent?.get(magnetURI) || undefined;
	}

	private handleSignaling(): void {
		this.signalingService.on('notification', async (notification) => {
			logger.debug(
				'signalingService "notification" event [method:%s, data:%o]',
				notification.method, notification.data);

			try {
				switch (notification.method) {
					case 'sendFile': {
						break;
					}
				}
			} catch (error) {
				logger.error('error on signalService "notification" event [error:%o]', error);
			}
		});
	}

	public async init(
		tracker: string,
		iceServers?: RTCIceServer[]
	): Promise<void> {
		logger.debug('init()');

		this.tracker = tracker;

		this.webTorrent = new WebTorrent({
			tracker: {
				rtcConfig: {
					iceServers: iceServers
				}
			},
		});
	}

	public async sendFiles(files: FileList): Promise<string> {
		return new Promise((resolve, reject) => {
			createTorrent(files, async (error, torrent) => {
				if (error)
					return reject(error);
	
				const existingTorrent = this.webTorrent?.get(torrent);
	
				if (existingTorrent) {
					await this.signalingService.sendRequest('sendFile', { magnetURI: existingTorrent.magnetURI })
						.catch((err) => logger.warn('sendFile, unable to send file [magnetURI:%s, error:%o]', existingTorrent.magnetURI, err));

					return resolve(existingTorrent.magnetURI);
				}
	
				this.webTorrent?.seed(
					files,
					{ announceList: [ [ this.tracker ] ] },
					async (newTorrent) => {
						await this.signalingService.sendRequest('sendFile', { magnetURI: newTorrent.magnetURI })
							.catch((err) => logger.warn('sendFile, unable to send file [magnetURI:%s, error:%o]', newTorrent.magnetURI, err));

						return resolve(newTorrent.magnetURI);
					}
				);
			});
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