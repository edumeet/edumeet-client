import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({ babel: { parserOpts: {} } }),
		eslint(),
		viteTsconfigPaths(),
		basicSsl(),
		splitVendorChunkPlugin(),
		visualizer({
			emitFile: false,
			filename: "stats.html",
		})

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
		rollupOptions: {
			output: {
				manualChunks(id: string) {
					// creating a chunk to @open-ish deps. Reducing the vendor chunk size
					if (id.includes('@mui') ) {
						if (id.includes('material')){
							return '@mui-material';
						} else {
							return '@mui';
						}
					}
					// creating a chunk to react routes deps. Reducing the vendor chunk size
					if (
						id.includes('react-dom')
					) {
						return '@react-dom';
					}
					if (
						id.includes('@formatjs')
					) {
						return '@formatjs';
					}
					if (
						id.includes('@tanstack')
					) {
						return '@tanstack';
					}
					if (
						id.includes('@observrtc')
					) {
						return '@observrtc';
					}
					if (
						id.includes('router')
					) {
						return '@router';
					}
					if (
						id.includes('ortc-p2p')
					) {
						return '@ortc-p2p';
					}
				},
			},
		},
		outDir: 'build',
	},
});
