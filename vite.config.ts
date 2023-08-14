import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				parserOpts: {
					plugins: ['decorators-legacy'],
				},
			},
		}),
		eslint({
			exclude: ["src/services/lib/tflite/tflite-simd.js", "src/services/lib/tflite/tflite.js"]
		}),
		viteTsconfigPaths(),
		basicSsl()
	],
	server: {
		https: true,
		port: 4443,
		host: true,
		hmr: {
			path: '/vite/'
		}
	},
	resolve: {
		alias: {
			'webtorrent': 'webtorrent/dist/webtorrent.min.js',
		},
	},
	build: {
		outDir: 'build',
	},
});