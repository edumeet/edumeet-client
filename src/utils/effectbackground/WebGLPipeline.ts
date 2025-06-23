/**
 * Implementation from Volcomix virtual background demo.
 * With minor refactoring.
 *
 * Copyright: Sébastien Jalliffier Verne
 * License: Apache 2.0
 * https://github.com/Volcomix/virtual-background#webgl-2
 */

import { BackgroundEffectPipeline, BackgroundPipelineOptions } from '../types';
import { buildBackgroundBlurStage } from './WebGLStages/blurBackground';
import { buildBackgroundImageStage } from './WebGLStages/imageBackground';
import { buildJointBilateralFilterStage } from './WebGLStages/jointBilateralFilter';
import { buildLoadSegmentationStage } from './WebGLStages/loadSegmentation';
import { buildResizingStage } from './WebGLStages/resize';
import { compileShader, createTexture } from './helpers/WebGL';
import { WebGLWorker } from './helpers/WebGLWorker';
import { shaderSources } from './shaderSources';

export const webglConfig = {
	SIGMA_SPACE: 1,
	SIGMA_COLOR: 0.1,
	COVERAGE: [ 0.5, 0.75 ]
};

export const createWebGLPipeline = ({
	source,
	canvas,
	backend,
	segmentation,
	backgroundConfig,
}: BackgroundPipelineOptions): BackgroundEffectPipeline => {
	const worker = new WebGLWorker();

	const gl = canvas.getContext('webgl2');

	if (!gl) throw new Error('No WebGL context');

	const mainVertexShader = compileShader(gl, gl.VERTEX_SHADER, shaderSources.mainVertex);

	const vao = gl.createVertexArray();

	gl.bindVertexArray(vao); // makes the vertex array the current

	const positionBuffer = gl.createBuffer();

	if (!positionBuffer) throw new Error('No positionBuffer');

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0 ]),
		gl.STATIC_DRAW
	);

	const texCoordBuffer = gl.createBuffer();

	if (!texCoordBuffer) throw new Error('no texCoordBuffer');

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0 ]),
		gl.STATIC_DRAW
	);

	const inputFrameTexture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	const segmentationTexture = createTexture(
		gl,
		gl.RGBA8,
		segmentation.width,
		segmentation.height
	);

	if (!segmentationTexture) throw new Error('No segmentationTexture');

	const personMaskTexture = createTexture(
		gl,
		gl.RGBA8,
		source.dimensions.width,
		source.dimensions.height
	);

	if (!personMaskTexture) throw new Error('No personMaskTexture');

	const resizingStage = buildResizingStage(
		worker,
		gl,
		mainVertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentation,
		backend
	);

	const loadSegmentationStage = buildLoadSegmentationStage(
		gl,
		mainVertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentation,
		backend,
		segmentationTexture
	);

	const jointBilateralFilterStage = buildJointBilateralFilterStage(
		gl,
		mainVertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentationTexture,
		segmentation,
		personMaskTexture,
		canvas
	);

	const backgroundImage: HTMLImageElement | null = new Image();

	if (backgroundConfig?.url) backgroundImage.src = backgroundConfig.url;

	const backgroundStage =
		backgroundConfig?.type === 'blur'
			? buildBackgroundBlurStage(
				gl,
				mainVertexShader,
				positionBuffer,
				texCoordBuffer,
				personMaskTexture,
				canvas
			)
			: buildBackgroundImageStage(
				gl,
				positionBuffer,
				texCoordBuffer,
				personMaskTexture,
				backgroundImage,
				canvas
			);

	async function render() {
		if (!gl) throw new Error('No rendering context');

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			source.element,
		);

		gl.bindVertexArray(vao);

		await resizingStage.render();

		backend._runInference();

		loadSegmentationStage.render();
		jointBilateralFilterStage.render();
		backgroundStage.render();
	}

	function cleanup() {
		if (!gl) throw new Error('No rendering context');

		backgroundStage.cleanUp();
		jointBilateralFilterStage.cleanUp();
		loadSegmentationStage.cleanUp();
		resizingStage.cleanUp();
		worker.close();

		gl.deleteTexture(personMaskTexture);
		gl.deleteTexture(segmentationTexture);
		gl.deleteTexture(inputFrameTexture);
		gl.deleteBuffer(texCoordBuffer);
		gl.deleteBuffer(positionBuffer);
		gl.deleteVertexArray(vao);
		gl.deleteShader(mainVertexShader);
	}

	return { render, cleanup };
};
