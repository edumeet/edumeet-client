import { defineConfig, /* splitVendorChunkPlugin */ } from 'vite';
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
/* 		splitVendorChunkPlugin(),
 */		visualizer({
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
					if (
						id.includes('ortc-p2p')
					) {
						return '@ortc-p2p';
					}
					if (
						id.includes('material-react-table/dist/index.esm.js')
					) {
						return 'material-react-table/dist/index.esm.js';
					}
					if (
						id.includes('x-date-pickers')
					) {
						return 'x-date-pickers';
					}
					if (
						id.includes('managementservice')
					) {
						return 'managementservice';
					}
					if (
						id.includes('react-dom')
					) {
						return 'react-dom';
					}
					if (
						id.includes('fabric')
					) {
						return 'fabric';
					}
					if (
						id.includes('browser')
					) {
						return 'browser';
					}
					if (
						id.includes('notistack')
					) {
						return 'notistack';
					}
					if (
						id.includes('@mui')
					) {
						return '@mui';
					}

				},
			},
		},
		outDir: 'build',
	},
});
