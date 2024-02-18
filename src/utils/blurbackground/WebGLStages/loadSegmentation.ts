import { TFLite } from '../../BlurTrack';
import {
	compileShader,
	createPiplelineStageProgram,
	createTexture,
} from '../helpers/WebGL';
import { shaderSources } from '../shaderSources';

export function buildLoadSegmentationStage(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	source: {
    width: number,
    height: number
  },
	backend: TFLite,
	outputTexture: WebGLTexture
) {

	const tfliteOutputMemoryOffset = backend._getOutputMemoryOffset() / 4;

	const segmentationWidth = source.width;
	const segmentationHeight = source.height;

	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.segmentationFragment
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const inputLocation = gl.getUniformLocation(program, 'u_inputSegmentation');
	const inputTexture = createTexture(
		gl,
		gl.R32F,
		segmentationWidth,
		segmentationHeight
	);

	const frameBuffer = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,
		gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D,
		outputTexture,
		0
	);

	gl.useProgram(program);
	gl.uniform1i(inputLocation, 1);

	function render() {
		gl.viewport(0, 0, segmentationWidth, segmentationHeight);
		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, inputTexture);
		gl.texSubImage2D(
			gl.TEXTURE_2D,
			0,
			0,
			0,
			segmentationWidth,
			segmentationHeight,
			gl.RED,
			gl.FLOAT,
			backend.HEAPF32,
			tfliteOutputMemoryOffset
		);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	function cleanUp() {
		gl.deleteFramebuffer(frameBuffer);
		gl.deleteTexture(inputTexture);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
	}

	return { render, cleanUp };
}