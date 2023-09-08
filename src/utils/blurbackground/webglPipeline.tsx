/**
 * Implementation from Volcomix virtual background demo.
 * With minor refactoring.
 * 
 * Copyright: Sébastien Jalliffier Verne  
 * License: Apache 2.0
 * https://github.com/Volcomix/virtual-background#webgl-2
 */

import { BlurBackgroundPipeline, BlurBackgroundPipelineOptions } from '../types';
import { buildBackgroundBlurStage } from './webglStages/backgroundBlurStage';
import { buildJointBilateralFilterStage } from './webglStages/jointBilateralFilterStage';
import { buildLoadSegmentationStage } from './webglStages/loadSegmentationStage';
import { buildResizingStage } from './webglStages/resizingStage';
import { compileShader, createTexture } from './helpers/webgl';
import { WebGLWorker } from './helpers/WebglWorker';
import { shaderSources } from './shaderSources';

export const createWebGLPipeline = ({ source, canvas, backend, segmentation }: BlurBackgroundPipelineOptions): BlurBackgroundPipeline => {
	const worker = new WebGLWorker();
  
	const gl = canvas.getContext('webgl2');

	if (!gl) throw new Error('No WebGL context');
  
	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, shaderSources.mainVertex);
  
	const vertexArray = gl.createVertexArray();

	gl.bindVertexArray(vertexArray);
  
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
		vertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentation,
		backend
	);
	const loadSegmentationStage = buildLoadSegmentationStage(
		gl,
		vertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentation,
		backend,
		segmentationTexture);
	const jointBilateralFilterStage = buildJointBilateralFilterStage(
		gl,
		vertexShader,
		positionBuffer,
		texCoordBuffer,
		segmentationTexture,
		segmentation,
		personMaskTexture,
		canvas
	);
	const backgroundStage = buildBackgroundBlurStage(
		gl,
		vertexShader,
		positionBuffer,
		texCoordBuffer,
		personMaskTexture,
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
			source.element
		);
  
		gl.bindVertexArray(vertexArray);
  
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
		gl.deleteVertexArray(vertexArray);
		gl.deleteShader(vertexShader);
	}
  
	return { render, cleanup };
};
