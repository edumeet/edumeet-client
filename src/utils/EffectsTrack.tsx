import type { BodyPix } from '@tensorflow-models/body-pix';

export class EffectsTrack {
	private bodyPix: BodyPix;
	public outputTrack: MediaStreamTrack;

	private segmentationInterval?: NodeJS.Timeout;

	private source: HTMLVideoElement;
	private outputCanvas = document.createElement('canvas');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	private outputContext = this.outputCanvas.getContext('2d')!;
	private segmentationCanvas = document.createElement('canvas');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	private segmentationContext = this.segmentationCanvas.getContext('2d')!;

	private segmentationPixelCount: number;
	private segmentationMask: ImageData;

	constructor(bodyPix: BodyPix, public inputTrack: MediaStreamTrack) {
		this.bodyPix = bodyPix;

		const { deviceId, width = 640, height = 360 } = inputTrack.getSettings();

		this.segmentationPixelCount = width * height;
		this.segmentationMask = new ImageData(width, height);

		this.source = document.createElement('video');
		this.source.autoplay = true;
		this.source.playsInline = true;
		this.source.style.visibility = 'hidden';
		this.source.width = width;
		this.source.height = height;

		this.outputCanvas.hidden = true;
		this.outputCanvas.width = width;
		this.outputCanvas.height = height;

		this.segmentationCanvas.hidden = true;
		this.segmentationCanvas.width = width;
		this.segmentationCanvas.height = height;

		this.source.srcObject = new MediaStream([ inputTrack ]);

		this.perform();

		this.outputTrack = this.outputCanvas.captureStream().getVideoTracks()[0];
		this.outputTrack.applyConstraints({ deviceId, width, height });
	}

	public stop(): void {
		clearInterval(this.segmentationInterval);

		this.source.srcObject = null;

		this.source.remove();
		this.outputCanvas.remove();
		this.segmentationCanvas.remove();

		this.outputTrack.stop();
		this.inputTrack.stop();
	}

	private perform() {
		this.segmentationInterval = setInterval(async () => {
			this.segmentationContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
			this.segmentationContext.drawImage(this.source, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
		
			const segmentation = await this.bodyPix.segmentPerson(this.segmentationCanvas);

			for (let i = 0; i < this.segmentationPixelCount; i++) {
				this.segmentationMask.data[(i * 4) + 3] = segmentation.data[i] ? 255 : 0;
			}

			this.segmentationContext.putImageData(this.segmentationMask, 0, 0);

			this.runPostProcessing(this.source, this.segmentationCanvas, 5);
		}, 1000 / 30);
	}

	private runPostProcessing(image: HTMLVideoElement, segmentation: HTMLCanvasElement, blurAmount: number) {
		this.clearCanvas();

		this.outputContext.globalCompositeOperation = 'copy';
		this.outputContext.filter = 'none';

		this.outputContext.filter = 'blur(5px)';

		this.drawSegmentationMask(segmentation);

		this.outputContext.globalCompositeOperation = 'source-in';
		this.outputContext.filter = 'none';

		this.outputContext.drawImage(image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);

		this.blurBackground(image, blurAmount);

		this.outputContext.restore();
	}

	private drawSegmentationMask(segmentation: HTMLCanvasElement) {
		this.outputContext.drawImage(segmentation, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
	}

	private blurBackground(image: HTMLVideoElement, blurAmount: number) {
		this.outputContext.globalCompositeOperation = 'destination-over';
		this.outputContext.filter = `blur(${blurAmount}px)`;
		this.outputContext.drawImage(image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
	}

	private clearCanvas() {
		this.outputContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
	}
}