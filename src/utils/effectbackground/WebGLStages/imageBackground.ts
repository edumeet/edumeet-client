import { Logger } from '../../Logger';
import {
	compileShader,
	createPiplelineStageProgram,
	createTexture,
} from '../helpers/WebGL';
import { shaderSources } from '../shaderSources';
import { webglConfig } from '../WebGLPipeline';

export type BackgroundImageStage = {
  render(): void
  cleanUp(): void
}

export function buildBackgroundImageStage(
	gl: WebGL2RenderingContext,
	positionBuffer: WebGLBuffer,
	texCoordBuffer: WebGLBuffer,
	personMaskTexture: WebGLTexture,
	backgroundImage: HTMLImageElement | null,
	canvas: HTMLCanvasElement
): BackgroundImageStage {
	const logger = new Logger('BgImg');

	const { width: outputWidth, height: outputHeight } = canvas;
	const outputRatio = outputWidth / outputHeight;

	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, shaderSources.buildBackgroundImageVertexShaderSource);
	const fragmentShader = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		shaderSources.buildBackgroundImageFragmentShaderSource
	);
	const program = createPiplelineStageProgram(
		gl,
		vertexShader,
		fragmentShader,
		positionBuffer,
		texCoordBuffer
	);
	const backgroundScaleLocation = gl.getUniformLocation(
		program,
		'u_backgroundScale'
	);
	const backgroundOffsetLocation = gl.getUniformLocation(
		program,
		'u_backgroundOffset'
	);
	const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame');
	const personMaskLocation = gl.getUniformLocation(program, 'u_personMask');
	const backgroundLocation = gl.getUniformLocation(program, 'u_background');
	const coverageLocation = gl.getUniformLocation(program, 'u_coverage');
	const lightWrappingLocation = gl.getUniformLocation(
		program,
		'u_lightWrapping'
	);
	const blendModeLocation = gl.getUniformLocation(program, 'u_blendMode');

	logger.debug('got uniform locations..');

	gl.useProgram(program);
	gl.uniform2f(backgroundScaleLocation, 1, 1);
	gl.uniform2f(backgroundOffsetLocation, 0, 0);
	gl.uniform1i(inputFrameLocation, 0);
	gl.uniform1i(personMaskLocation, 1);
	gl.uniform2f(coverageLocation, webglConfig.COVERAGE[0], webglConfig.COVERAGE[1]);

	gl.uniform1f(lightWrappingLocation, 0);
	gl.uniform1f(blendModeLocation, 0);

	let backgroundTexture: WebGLTexture | null = null;
	// TODO Find a better to handle background being loaded

	let backgroundReady = false;

	if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
		logger.debug('backgroundImage.complete and valid');
		updateBackgroundImage(backgroundImage);
	} else if (backgroundImage) {
		logger.debug('backgroundImage not complete yet...');
		backgroundImage.onload = () => {
			logger.debug('backgroundImage loaded via onload');
			updateBackgroundImage(backgroundImage);
		};
		backgroundImage.onerror = () => {
			logger.error('Failed to load background image');
		};
	}

	function render() {
		if (!backgroundReady) {
			logger.debug('Background not ready');
			
			return;
		}
		gl.viewport(0, 0, outputWidth, outputHeight);
		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, personMaskTexture);
		if (backgroundTexture !== null) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
			// TODO Handle correctly the background not loaded yet
			gl.uniform1i(backgroundLocation, 2);
		} else {
			logger.error('backgroundTexture is not initialized');
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	function updateBackgroundImage(bgImage: HTMLImageElement) {
		backgroundTexture = createTexture(
			gl,
			gl.RGBA8,
			bgImage.naturalWidth,
			bgImage.naturalHeight,
			9728,
			gl.LINEAR
		);
		gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);

		gl.texSubImage2D(
			gl.TEXTURE_2D,
			0,
			0,
			0,
			bgImage.naturalWidth,
			bgImage.naturalHeight,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			bgImage
		);

		let xOffset = 0;
		let yOffset = 0;
		let backgroundWidth = bgImage.naturalWidth;
		let backgroundHeight = bgImage.naturalHeight;
		const backgroundRatio = backgroundWidth / backgroundHeight;

		if (backgroundRatio < outputRatio) {
			backgroundHeight = backgroundWidth / outputRatio;
			yOffset = (bgImage.naturalHeight - backgroundHeight) / 2;
		} else {
			backgroundWidth = backgroundHeight * outputRatio;
			xOffset = (bgImage.naturalWidth - backgroundWidth) / 2;
		}

		const xScale = backgroundWidth / bgImage.naturalWidth;
		const yScale = backgroundHeight / bgImage.naturalHeight;

		xOffset /= bgImage.naturalWidth;
		yOffset /= bgImage.naturalHeight;

		gl.uniform2f(backgroundScaleLocation, xScale, yScale);
		gl.uniform2f(backgroundOffsetLocation, xOffset, yOffset);

		backgroundReady = true;
	}

	// function updateLightWrapping(lightWrapping: number) {
	//	 gl.useProgram(program)
	//	 gl.uniform1f(lightWrappingLocation, lightWrapping)
	// }

	// function updateBlendMode(blendMode: BlendMode) {
	//	 gl.useProgram(program)
	//	 gl.uniform1f(blendModeLocation, blendMode === 'screen' ? 0 : 1)
	// }

	function cleanUp() {
		gl.deleteTexture(backgroundTexture);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
		gl.deleteShader(vertexShader);
	}

	return {
		render,
		// updateLightWrapping,
		// updateBlendMode,
		cleanUp,
	};
}
