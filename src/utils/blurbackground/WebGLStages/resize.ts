import { TFLite } from '../../BlurTrack';
import {
	compileShader,
	createPiplelineStageProgram,
	createTexture,
	readPixelsAsync,
} from '../helpers/WebGL';
import { WebGLWorker } from '../helpers/WebGLWorker';
import { shaderSources } from '../shaderSources';

export function buildResizingStage(
	worker: WebGLWorker,
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	source: {
    width: number,
    height: number
  },
	backend: TFLite
) {

	const tfliteInputMemoryOffset = backend._getInputMemoryOffset() / 4;

	const outputWidth = source.width;
	const outputHeight = source.height;
	const outputPixelCount = outputWidth * outputHeight;

	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.resizeFragment
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame');
	const outputTexture = createTexture(gl, gl.RGBA8, outputWidth, outputHeight);

	const frameBuffer = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,
		gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D,
		outputTexture,
		0
	);
	const outputPixels = new Uint8Array(outputPixelCount * 4);

	gl.useProgram(program);
	gl.uniform1i(inputFrameLocation, 0);

	async function render() {
		gl.viewport(0, 0, outputWidth, outputHeight);
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		const readPixelsPromise = readPixelsAsync(
			worker,
			gl,
			0,
			0,
			outputWidth,
			outputHeight,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			outputPixels
		);

		await readPixelsPromise;

		for (let i = 0; i < outputPixelCount; i++) {
			const tfliteIndex = tfliteInputMemoryOffset + (i * 3);
			const outputIndex = i * 4;

			backend.HEAPF32[tfliteIndex] = outputPixels[outputIndex] / 255;
			backend.HEAPF32[tfliteIndex + 1] = outputPixels[outputIndex + 1] / 255;
			backend.HEAPF32[tfliteIndex + 2] = outputPixels[outputIndex + 2] / 255;
		}
	}

	function cleanUp() {
		gl.deleteFramebuffer(frameBuffer);
		gl.deleteTexture(outputTexture);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
	}

	return { render, cleanUp };
}