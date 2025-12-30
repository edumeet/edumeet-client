import type WebTorrent from 'webtorrent';
import { Logger } from '../utils/Logger';

const logger = new Logger('FileService');

export type LocalTorrentFile = WebTorrent.TorrentFile & {
	blob: () => Promise<Blob>;
};

export type LocalWebTorrent = WebTorrent.Torrent & {
	files?: LocalTorrentFile[];
};

type WebTorrentConstructor = new (opts?: WebTorrent.Options) => WebTorrent.Instance;

export class FileService {
	private activeClient?: WebTorrent.Instance;
	private legacyClients: WebTorrent.Instance[] = [];
	private TorrentCtor?: WebTorrentConstructor;
	private watchedLegacyClients = new WeakSet<WebTorrent.Instance>();
	private legacyCleanupTimer?: number;

	public tracker?: string;
	public maxFileSize: number = 100_000_000;
	public iceServers: RTCIceServer[] = [];

	private async getCtor(): Promise<WebTorrentConstructor> {
		if (this.TorrentCtor) return this.TorrentCtor;

		const mod = await import('webtorrent');

		// @types/webtorrent is often CommonJS-shaped, while bundlers may provide ESM default.
		const Ctor =
			(mod as unknown as { default?: WebTorrentConstructor }).default
			|| (mod as unknown as WebTorrentConstructor);

		this.TorrentCtor = Ctor;

		return Ctor;
	}

	private async createClient(iceServers: RTCIceServer[]): Promise<WebTorrent.Instance> {
		const Ctor = await this.getCtor();

		logger.debug('createClient() iceServers used=%o', iceServers);

		return new Ctor({
			tracker: {
				rtcConfig: {
					iceServers,
				},
			},
		});
	}

	private async init(): Promise<void> {
		if (this.activeClient) return;

		logger.debug('init()');

		this.activeClient = await this.createClient(this.iceServers);
	}

	private getAllClients(): WebTorrent.Instance[] {
		const clients: WebTorrent.Instance[] = [];

		if (this.activeClient) clients.push(this.activeClient);
		if (this.legacyClients.length) clients.push(...this.legacyClients);

		return clients;
	}

	private scheduleLegacyCleanup(): void {
		if (this.legacyCleanupTimer) return;

		this.legacyCleanupTimer = window.setTimeout(() => {
			this.legacyCleanupTimer = undefined;
			this.gcLegacyClients();
		}, 0);
	}

	private trackLegacyClient(client: WebTorrent.Instance): void {
		if (this.watchedLegacyClients.has(client)) return;

		this.watchedLegacyClients.add(client);

		const attachTorrentListeners = (torrent: WebTorrent.Torrent) => {
			torrent.on('done', () => this.scheduleLegacyCleanup());
			torrent.on('error', () => this.scheduleLegacyCleanup());
		};

		for (const torrent of client.torrents || []) {
			attachTorrentListeners(torrent);
		}

		client.on('torrent', (torrent: WebTorrent.Torrent) => {
			attachTorrentListeners(torrent);
		});

		this.scheduleLegacyCleanup();
	}

	private gcLegacyClients(): void {
		const stillNeeded: WebTorrent.Instance[] = [];

		for (const client of this.legacyClients) {
			if (client.torrents?.length) {
				stillNeeded.push(client);
				continue;
			}

			client.destroy?.();
		}

		this.legacyClients = stillNeeded;
	}

	public async getTorrent(magnetURI: string) {
		for (const client of this.getAllClients()) {
			const torrent = client.get(magnetURI) as WebTorrent.Torrent | undefined;
			if (torrent) return torrent as LocalWebTorrent;
		}

		return undefined;
	}

	public async reinitWithIceServers(iceServers: RTCIceServer[]) {
		this.iceServers = iceServers;

		if (this.activeClient) {
			this.trackLegacyClient(this.activeClient);
			this.legacyClients.push(this.activeClient);
			this.activeClient = undefined;
		}

		this.activeClient = await this.createClient(this.iceServers);

		this.scheduleLegacyCleanup();
	}

	public async sendFiles(files: FileList): Promise<string> {
		await this.init();

		return new Promise((resolve) => {
			this.activeClient?.seed(
				files,
				this.tracker ? { announceList: [ [ this.tracker ] ], private: true } : undefined,
				(newTorrent) => resolve(newTorrent.magnetURI)
			);
		});
	}

	public async downloadFile(magnetURI: string): Promise<LocalWebTorrent | undefined> {
		await this.init();

		const existingTorrent = await this.getTorrent(magnetURI);

		if (existingTorrent)
			return existingTorrent as LocalWebTorrent;

		return new Promise((resolve) => {
			this.activeClient?.add(magnetURI, (torrent) => {
				resolve(torrent as LocalWebTorrent);
			});
		});
	}

	public async removeFile(magnetURI: string): Promise<void> {
		for (const client of this.getAllClients()) {
			const torrent = client.get(magnetURI);
			if (!torrent) continue;

			client.remove(magnetURI);
		}

		this.scheduleLegacyCleanup();
	}

	public async removeFiles(): Promise<void> {
		for (const client of this.getAllClients()) {
			const torrents = client.torrents ? [ ...client.torrents ] : [];

			for (const torrent of torrents) {
				client.remove(torrent);
			}
		}

		this.scheduleLegacyCleanup();
	}
}
