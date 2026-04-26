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
			// Single moment instance with all locales pre-bundled. The plain `moment`
			// package only ships 'en' by default; side-effect imports like
			// `import 'moment/locale/pl'` or `import 'moment/min/locales'` were getting
			// dropped or registering on a separate instance during Vite production builds,
			// so AdapterMoment kept seeing a moment with `locales() === ['en']`.
			// Aliasing forces every consumer (our code, @mui/x-date-pickers/AdapterMoment,
			// any other dep that imports 'moment') onto the same locales-included build.
			'moment': 'moment/min/moment-with-locales',
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
					
				},
			},
		},
		outDir: 'build',
	},
});
