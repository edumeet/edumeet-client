import { Logger } from '../Logger';
import { BackgroundEffectPipeline, BackgroundPipelineOptions } from '../types';

const logger = new Logger('canvasPipeline');

export const createCanvasPipeline = ({ source, canvas, backend, segmentation }: BackgroundPipelineOptions): BackgroundEffectPipeline => {
	logger.debug('createCanvasPipeline() [input: %o, segmentation: %o] ', source.dimensions, segmentation);

	const segMaskCanvas = document.createElement('canvas');
	const segMaskCtx = segMaskCanvas.getContext('2d', { willReadFrequently: true });
	const segMask = new ImageData(segmentation.width, segmentation.height);

	const outputMemoryOffset = backend._getOutputMemoryOffset() / 4;
	const inputMemoryOffset = backend._getInputMemoryOffset() / 4;
	const segPixelCount = segmentation.width * segmentation.height;

	const ctx = canvas.getContext('2d', { willReadFrequently: true });

	const render = () => {
		try {
			doResize();
			doInference();
			doPostProcessing();
		} catch (e) {
			logger.error(e);
		}
	};

	const doResize = () => {
		if (!segMask) throw new Error('No segmentation mask');
		if (!segMaskCtx) throw new Error('No segmentation mask context');
		
		segMaskCtx.drawImage(
			source.element,
			0,
			0,
			source.element.width,
			source.element.height,
			0,
			0,
			segmentation.width,
			segmentation.height
		);

		const imageData = segMaskCtx.getImageData(
			0,
			0,
			segmentation.width,
			segmentation.height
		);

		if (!backend || !inputMemoryOffset) throw new Error('No ML backend');
	
		for (let i = 0; i < segPixelCount; i++) {
			backend.HEAPF32[inputMemoryOffset + (i * 3)] = imageData.data[i * 4] / 255;
			backend.HEAPF32[inputMemoryOffset + (i * 3) + 1] = imageData.data[(i * 4) + 1] / 255;
			backend.HEAPF32[inputMemoryOffset + (i * 3) + 2] = imageData.data[(i * 4) + 2] / 255;
		}
	};

	const doInference = () => {
		if (!backend) throw new Error('No ML backend');
		if (!outputMemoryOffset) throw new Error('No output memory offset');
	
		backend._runInference();

		if (!segMask) throw new Error('No segmentation mask');
	
		for (let i = 0; i < segPixelCount; i++) {
			const person = backend.HEAPF32[outputMemoryOffset + i];

			segMask.data[(i * 4) + 3] = 255 * person;
		}
	
		if (!segMaskCtx) throw new Error('No segmentation mask context');
	
		segMaskCtx.putImageData(segMask, 0, 0);
	};

	const doPostProcessing = () => {
		if (!ctx) throw new Error('No output context');

		ctx.globalCompositeOperation = 'copy';
		ctx.filter = 'blur(8px)';
		ctx.drawImage(
			segMaskCanvas,
			0,
			0,
			segmentation.width,
			segmentation.height,
			0,
			0,
			source.element.width,
			source.element.height
		);
		ctx.globalCompositeOperation = 'source-in';
		ctx.filter = 'none';

		// Draw the foreground video.
		ctx.drawImage(source.element, 0, 0);

		// Draw the background.
		ctx.globalCompositeOperation = 'destination-over';
		ctx.filter = 'blur(8px)';
		ctx.drawImage(source.element, 0, 0);
	};

	const cleanup = () => {
		// Not needed
	};

	return { render, cleanup };
};
