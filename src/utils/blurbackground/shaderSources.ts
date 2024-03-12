export const shaderSources = {
	mainVertex: String.raw`#version 300 es

		in vec2 a_position;
		in vec2 a_texCoord;

		out vec2 v_texCoord;

		void main() {
			gl_Position = vec4(a_position, 0.0, 1.0);
			v_texCoord = a_texCoord;
		}
	`,

	blurFragment: String.raw`#version 300 es

		precision highp float;

		uniform sampler2D u_inputFrame;
		uniform sampler2D u_personMask;
		uniform vec2 u_texelSize;

		in vec2 v_texCoord;

		out vec4 outColor;

		const float offset[5] = float[](0.0, 1.0, 2.0, 3.0, 4.0);
		const float weight[5] = float[](0.2270270270, 0.1945945946, 0.1216216216,
			0.0540540541, 0.0162162162);

		void main() {
			vec4 centerColor = texture(u_inputFrame, v_texCoord);
			float personMask = texture(u_personMask, v_texCoord).a;

			vec4 frameColor = centerColor * weight[0] * (1.0 - personMask);

			for (int i = 1; i < 5; i++) {
				vec2 offset = vec2(offset[i]) * u_texelSize;

				vec2 texCoord = v_texCoord + offset;
				frameColor += texture(u_inputFrame, texCoord) * weight[i] *
					(1.0 - texture(u_personMask, texCoord).a);

				texCoord = v_texCoord - offset;
				frameColor += texture(u_inputFrame, texCoord) * weight[i] *
					(1.0 - texture(u_personMask, texCoord).a);
			}
			outColor = vec4(frameColor.rgb + (1.0 - frameColor.a) * centerColor.rgb, 1.0);
		}
	`,

	blendVertex: String.raw`#version 300 es

		in vec2 a_position;
		in vec2 a_texCoord;

		out vec2 v_texCoord;

		void main() {
			// Flipping Y is required when rendering to canvas
			gl_Position = vec4(a_position * vec2(1.0, -1.0), 0.0, 1.0);
			v_texCoord = a_texCoord;
		}
	`,

	blendFragment: String.raw`#version 300 es

		precision highp float;

		uniform sampler2D u_inputFrame;
		uniform sampler2D u_personMask;
		uniform sampler2D u_blurredInputFrame;
		uniform vec2 u_coverage;

		in vec2 v_texCoord;

		out vec4 outColor;

		void main() {
			vec3 color = texture(u_inputFrame, v_texCoord).rgb;
			vec3 blurredColor = texture(u_blurredInputFrame, v_texCoord).rgb;
			float personMask = texture(u_personMask, v_texCoord).a;
			personMask = smoothstep(u_coverage.x, u_coverage.y, personMask);
			outColor = vec4(mix(blurredColor, color, personMask), 1.0);
		}
	`,

	joinBilateralFragment: String.raw`#version 300 es

		precision highp float;

		uniform sampler2D u_inputFrame;
		uniform sampler2D u_segmentationMask;
		uniform vec2 u_texelSize;
		uniform float u_step;
		uniform float u_radius;
		uniform float u_offset;
		uniform float u_sigmaTexel;
		uniform float u_sigmaColor;

		in vec2 v_texCoord;

		out vec4 outColor;

		float gaussian(float x, float sigma) {
			float coeff = -0.5 / (sigma * sigma * 4.0 + 1.0e-6);
			return exp((x * x) * coeff);
		}

		void main() {
			vec2 centerCoord = v_texCoord;
			vec3 centerColor = texture(u_inputFrame, centerCoord).rgb;
			float newVal = 0.0;

			float spaceWeight = 0.0;
			float colorWeight = 0.0;
			float totalWeight = 0.0;

			// Subsample kernel space.
			for (float i = -u_radius + u_offset; i <= u_radius; i += u_step) {
				for (float j = -u_radius + u_offset; j <= u_radius; j += u_step) {
					vec2 shift = vec2(j, i) * u_texelSize;
					vec2 coord = vec2(centerCoord + shift);
					vec3 frameColor = texture(u_inputFrame, coord).rgb;
					float outVal = texture(u_segmentationMask, coord).a;

					spaceWeight = gaussian(distance(centerCoord, coord), u_sigmaTexel);
					colorWeight = gaussian(distance(centerColor, frameColor), u_sigmaColor);
					totalWeight += spaceWeight * colorWeight;

					newVal += spaceWeight * colorWeight * outVal;
				}
			}
			newVal /= totalWeight;

			outColor = vec4(vec3(0.0), newVal);
		}
	`,

	resizeFragment: String.raw`#version 300 es

		precision highp float;

		uniform sampler2D u_inputFrame;

		in vec2 v_texCoord;

		out vec4 outColor;

		void main() {
			outColor = texture(u_inputFrame, v_texCoord);
		}
	`,

	segmentationFragment: String.raw`#version 300 es

		precision highp float;

		uniform sampler2D u_inputSegmentation;

		in vec2 v_texCoord;

		out vec4 outColor;

		void main() {
			float segmentation = texture(u_inputSegmentation, v_texCoord).r;
			outColor = vec4(vec3(0.0), segmentation);
		}
	`
};
