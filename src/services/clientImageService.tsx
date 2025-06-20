import { Logger } from '../utils/Logger';

export type ThumbnailItem = { imageName: string; thumbnailUrl: string };

const logger = new Logger('ImageFileService');

const IMAGE_DIR = 'images';
const THUMBNAIL_SUFFIX = '_thumb';

export const ImageKeys = {
	DESKTOP_BACKGROUND: 'userDesktopBackgroundImage',
	VIDEO_BACKGROUND: 'videoBackgroundImage',
} as const;

type ImageKeysType = typeof ImageKeys[keyof typeof ImageKeys];

export class ClientImageService {
	private imagesDirHandle!: FileSystemDirectoryHandle;
	private initialized = false;
	private earmarkedImages: Record<ImageKeysType, string | null> = {
		[ImageKeys.DESKTOP_BACKGROUND]: null,
		[ImageKeys.VIDEO_BACKGROUND]: null,
	};

	private async init(): Promise<void> {
		if (this.initialized) return;

		logger.debug('init()');

		const rootDirHandle = await navigator.storage.getDirectory();

		this.imagesDirHandle = await rootDirHandle.getDirectoryHandle(
			IMAGE_DIR,
			{ create: true }
		);

		this.loadThumbnails();

		this.initialized = true;
	}

	/**
	 * Get an earmarked image from memory.
	 *
	 * @param earmarkedImageName a key to an image stored in memory by this service.
	 */
	public async getEarmarkedImage(earmarkedImageName: ImageKeysType): Promise<string | null> {
		await this.init();

		return this.earmarkedImages[earmarkedImageName];
	}

	/**
	 * Save and set an image to earmarked.
	 *
	 * @param imageName
	 * @param earmarkedImageName specifies which earkmarked image name to use.
	 */
	public async setEarmarkedImage(imageName: string, earmarkedImageName: ImageKeysType): Promise<void> {
		await this.init();

		const currentUrl = this.earmarkedImages[earmarkedImageName];

		if (currentUrl) URL.revokeObjectURL(currentUrl);

		this.earmarkedImages[earmarkedImageName] = await this.persistImage(imageName, earmarkedImageName);
	}

	private async persistImage(imageName: string, fileName: string): Promise<string> {
		const selectedHandle = await this.imagesDirHandle.getFileHandle(imageName, { create: false });
		const selectedFile = await selectedHandle.getFile();
		const userBackgroundFile = await this.saveImage(fileName, selectedFile);
		
		return URL.createObjectURL(userBackgroundFile);
	}

	/**
	 * Loads persisted earmarked image into memory.
	 *
	 * @param earmarkedImageName
	 * @returns object url string
	 */
	public async loadEarmarkedImage(earmarkedImageName: ImageKeysType): Promise<string> {
		await this.init();

		const currentUrl = this.earmarkedImages[earmarkedImageName];

		if (currentUrl) URL.revokeObjectURL(currentUrl);

		const fileHandle = await this.imagesDirHandle.getFileHandle(earmarkedImageName, { create: false });
		const earmarkedImage = URL.createObjectURL(await fileHandle.getFile());
	
		this.earmarkedImages[earmarkedImageName] = earmarkedImage;

		return earmarkedImage;
	}

	public async getImage(name: string): Promise<File | undefined> {
		this.init();

		try {
			const fileHandle = await this.imagesDirHandle.getFileHandle(name, { create: false });

			return await fileHandle.getFile();
		} catch (NotFoundError) {
			logger.warn(`File ${name} not found.`);

			return undefined;
		}
	}

	/**
	 * Saves image and a thumbnail copy.
	 * 
	 * @param image 
	 * @returns ThumbnailItem of saved image
	 */
	public async saveImageAndThumbnail(image: File): Promise<ThumbnailItem> {
		await this.saveImage(`${image.name}`, image);
		const thumbnail = await this.saveImage(image.name + THUMBNAIL_SUFFIX, await this.generateThumbnail(image));

		return {
			imageName: image.name,
			thumbnailUrl: URL.createObjectURL(thumbnail),
		};
	}

	private async saveImage(name: string, content: File | Blob): Promise<File> {
		await this.init();

		const imageFileHandle = await this.imagesDirHandle?.getFileHandle(name, { create: true });
		const writable = await imageFileHandle?.createWritable();

		await writable?.write(content);
		await writable?.close();

		return await imageFileHandle.getFile();
	}

	private async generateThumbnail(file: File, maxWidth = 300, maxHeight = 300): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = new Image();

			img.src = URL.createObjectURL(file);

			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > maxWidth) {
						height *= maxWidth / width;
						width = maxWidth;
					}
				} else if (height > maxHeight) {
					width *= maxHeight / height;
					height = maxHeight;
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					reject(new Error('Failed to get canvas context'));

					return;
				}

				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob((blob) => {
					if (blob) resolve(blob);
					else reject(new Error('Failed to create thumbnail'));
				}, 'image/png', 0.4);
			};

			img.onerror = () => reject(new Error('Failed to load image'));
		});
	}

	/**
	 * 
	 * @returns persisted images
	 */
	public async loadThumbnails(): Promise<ThumbnailItem[]> {
		await this.init();

		const thumbnails: ThumbnailItem[] = [];

		// @ts-expect-error root.entries() exists in later versions of ts
		for await (const entry of this.imagesDirHandle.values()) {
			if (entry.kind === 'file' && entry.name.endsWith(THUMBNAIL_SUFFIX)) {
				const file = await entry.getFile();

				thumbnails.push({
					imageName: entry.name.replace(THUMBNAIL_SUFFIX, ''),
					thumbnailUrl: URL.createObjectURL(file)
				});
			}
		}

		return thumbnails;
	}

	/**
	 * Deletes image and its thumbnail.
	 * 
	 * @param thumbnail
	 */
	public async deleteImage(thumbnail: ThumbnailItem) {
		this.init();

		const fileHandle = await this.imagesDirHandle.getFileHandle(thumbnail.imageName, { create: false });
		const fileThumbnailHandle = await this.imagesDirHandle.getFileHandle(thumbnail.imageName + THUMBNAIL_SUFFIX, { create: false });
	
		URL.revokeObjectURL(thumbnail.thumbnailUrl);
		await this.imagesDirHandle.removeEntry(fileHandle.name);
		await this.imagesDirHandle.removeEntry(fileThumbnailHandle.name);
	}
	
	public async clearStorage(thumbnailObjectUrls: ThumbnailItem[]) {
		for (const thumbnail of thumbnailObjectUrls) {
			URL.revokeObjectURL(thumbnail.thumbnailUrl);
		}

		// @ts-expect-error root.entries() exists in later versions of ts
		for await (const entry of this.imagesDirHandle.values()) {
			await this.imagesDirHandle.removeEntry(entry.name, { recursive: true });
		}
	}
}
