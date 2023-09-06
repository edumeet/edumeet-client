import {
	compileShader,
	createPiplelineStageProgram,
	createTexture,
} from '../helpers/webgl';
import { shaderSources } from '../shaderSources';

export type BackgroundBlurStage = {
  render(): void
  cleanUp(): void
}

export function buildBackgroundBlurStage(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	personMaskTexture: WebGLTexture,
	canvas: HTMLCanvasElement
): BackgroundBlurStage {
	const blurPass = buildBlurPass(
		gl,
		vertexShader,
		positionBuffer,
		texCoordBuffer,
		personMaskTexture,
		canvas
	);
	const blendPass = buildBlendPass(gl, positionBuffer, texCoordBuffer, canvas);

	function render() {
		blurPass.render();
		blendPass.render();
	}

	function cleanUp() {
		blendPass.cleanUp();
		blurPass.cleanUp();
	}

	return {
		render,
		cleanUp,
	};
}

function buildBlurPass(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	personMaskTexture: WebGLTexture,
	canvas: HTMLCanvasElement
) {

	const scale = 0.5;
	const outputWidth = canvas.width * scale;
	const outputHeight = canvas.height * scale;
	const texelWidth = 1 / outputWidth;
	const texelHeight = 1 / outputHeight;

	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.blurFragment
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame');
	const personMaskLocation = gl.getUniformLocation(program, 'u_personMask');
	const texelSizeLocation = gl.getUniformLocation(program, 'u_texelSize');
	const texture1 = createTexture(
		gl,
		gl.RGBA8,
		outputWidth,
		outputHeight,
		gl.NEAREST,
		gl.LINEAR
	);
	const texture2 = createTexture(
		gl,
		gl.RGBA8,
		outputWidth,
		outputHeight,
		gl.NEAREST,
		gl.LINEAR
	);

	const frameBuffer1 = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer1);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,
		gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D,
		texture1,
		0
	);

	const frameBuffer2 = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer2);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,
		gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D,
		texture2,
		0
	);

	gl.useProgram(program);
	gl.uniform1i(personMaskLocation, 1);

	function render() {
		gl.viewport(0, 0, outputWidth, outputHeight);
		gl.useProgram(program);
		gl.uniform1i(inputFrameLocation, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, personMaskTexture);

		for (let i = 0; i < 3; i++) {
			gl.uniform2f(texelSizeLocation, 0, texelHeight);
			gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer1);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, texture1);
			gl.uniform1i(inputFrameLocation, 2);

			gl.uniform2f(texelSizeLocation, texelWidth, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer2);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			gl.bindTexture(gl.TEXTURE_2D, texture2);
		}
	}

	function cleanUp() {
		gl.deleteFramebuffer(frameBuffer2);
		gl.deleteFramebuffer(frameBuffer1);
		gl.deleteTexture(texture2);
		gl.deleteTexture(texture1);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
	}

	return {
		render,
		cleanUp,
	};
}

function buildBlendPass(
	gl: WebGL2RenderingContext,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	canvas: HTMLCanvasElement
) {
	const { width: outputWidth, height: outputHeight } = canvas;

	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, shaderSources.blendVertex);
	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.blendFragment
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame');
	const personMaskLocation = gl.getUniformLocation(program, 'u_personMask');
	const blurredInputFrame = gl.getUniformLocation(
		program,
		'u_blurredInputFrame'
	);
	const coverageLocation = gl.getUniformLocation(program, 'u_coverage');

	gl.useProgram(program);
	gl.uniform1i(inputFrameLocation, 0);
	gl.uniform1i(personMaskLocation, 1);
	gl.uniform1i(blurredInputFrame, 2);
	gl.uniform2f(coverageLocation, 0.6, 0.9);

	function render() {
		gl.viewport(0, 0, outputWidth, outputHeight);
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	function updateCoverage(coverage: [number, number]) {
		gl.useProgram(program);
		gl.uniform2f(coverageLocation, coverage[0], coverage[1]);
	}

	function cleanUp() {
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
		gl.deleteShader(vertexShader);
	}

	return {
		render,
		updateCoverage,
		cleanUp,
	};
}
