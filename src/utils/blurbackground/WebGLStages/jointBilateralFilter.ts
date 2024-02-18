import { Dimensions } from '../../types';
import {
	compileShader,
	createPiplelineStageProgram,
} from '../helpers/WebGL';
import { shaderSources } from '../shaderSources';
import { webglConfig } from '../WebGLPipeline';

export function buildJointBilateralFilterStage(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	inputTexture: WebGLTexture,
	inputResolutions: Dimensions,
	outputTexture: WebGLTexture,
	canvas: HTMLCanvasElement
) {
	const { width: segmentationWidth, height: segmentationHeight } = inputResolutions;
	const { width: outputWidth, height: outputHeight } = canvas;
	const texelWidth = 1 / outputWidth;
	const texelHeight = 1 / outputHeight;

	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.joinBilateralFragment
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame');
	const segmentationMaskLocation = gl.getUniformLocation(
		program,
		'u_segmentationMask'
	);
	const texelSizeLocation = gl.getUniformLocation(program, 'u_texelSize');
	const stepLocation = gl.getUniformLocation(program, 'u_step');
	const radiusLocation = gl.getUniformLocation(program, 'u_radius');
	const offsetLocation = gl.getUniformLocation(program, 'u_offset');
	const sigmaTexelLocation = gl.getUniformLocation(program, 'u_sigmaTexel');
	const sigmaColorLocation = gl.getUniformLocation(program, 'u_sigmaColor');

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
	gl.uniform1i(inputFrameLocation, 0);
	gl.uniform1i(segmentationMaskLocation, 1);
	gl.uniform2f(texelSizeLocation, texelWidth, texelHeight);

	// Set sigmaSpace
	const sigmaSpace = webglConfig.SIGMA_SPACE * Math.max(
		outputWidth / segmentationWidth,
		outputHeight / segmentationHeight
	);

	const kSparsityFactor = 0.66; // Higher is more sparse.
	const sparsity = Math.max(1, Math.sqrt(sigmaSpace) * kSparsityFactor);
	const step = sparsity;
	const radius = sigmaSpace;
	const offset = step > 1 ? step * 0.5 : 0;
	const sigmaTexel = Math.max(texelWidth, texelHeight) * sigmaSpace;

	gl.useProgram(program);
	gl.uniform1f(stepLocation, step);
	gl.uniform1f(radiusLocation, radius);
	gl.uniform1f(offsetLocation, offset);
	gl.uniform1f(sigmaTexelLocation, sigmaTexel);

	// Set sigmaColor
	gl.useProgram(program);
	gl.uniform1f(sigmaColorLocation, webglConfig.SIGMA_COLOR);

	function render() {
		gl.viewport(0, 0, outputWidth, outputHeight);
		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, inputTexture);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	function cleanUp() {
		gl.deleteFramebuffer(frameBuffer);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
	}

	return { render, cleanUp };
}