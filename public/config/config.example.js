/**
 * eduMEET client configuration (example) — 4.2+
 *
 * This file is loaded by the browser (public/config/config.example.js) and must define
 * a single global `config` object (window.config).
 *
 * Notes:
 * - You can override only what you need. Unspecified keys fall back to built-in defaults.
 * - `theme` is merged into the app's Material UI theme (ThemeOptions), so you can override
 *	 any MUI theme option (e.g. `palette.primary.main`).
 */

var config = {
	/**
	 * If true, the user must authenticate before joining.
	 */
	loginEnabled: false,

	/**
	 * Optional: management service URL (used by some deployments).
	 * Leave undefined to disable.
	 */
	managementUrl: undefined,

	/**
	 * Room-server websocket port used in development builds.
	 */
	developmentPort: 8443,

	/**
	 * Room-server websocket port used in production builds.
	 */
	productionPort: 443,

	/**
	 * Optional: room-server hostname if it runs on a different host than the client.
	 * Leave undefined to use the current host.
	 */
	serverHostname: undefined,

	/**
	 * When leaving a room, keep the room name in the URL (handy for re-joining).
	 */
	keepRoomNameOnLeave: true,

	/**
	 * Ask for camera/microphone permissions on join.
	 */
	askForMediaOnJoin: true,

	/**
	 * Default webcam capture resolution: low | medium | high | veryhigh | ultra
	 */
	resolution: 'medium',

	/**
	 * Default webcam capture framerate (fps).
	 */
	frameRate: 30,

	/**
	 * Default screen sharing resolution: low | medium | high | veryhigh | ultra
	 */
	screenSharingResolution: 'veryhigh',

	/**
	 * Default screen sharing framerate (fps).
	 */
	screenSharingFrameRate: 5,

	/**
	 * Enable/disable simulcast for webcam video.
	 */
	simulcast: true,

	/**
	 * Enable/disable simulcast for screen sharing video.
	 */
	simulcastSharing: false,

	/**
	 * Enable/disable transcription UI.
	 */
	transcriptionEnabled: true,

	/**
	 * Randomize the room name when it is blank.
	 */
	randomizeOnBlank: true,

	/**
	 * Optional: enable QR code display in UI.
	 */
	qrCodeEnabled: false,

	/**
	 * Optional: enable countdown timer in UI.
	 */
	countdownTimerEnabled: false,

	/**
	 * Optional: enable "info" tooltip in UI.
	 */
	infoTooltipEnabled: false,

	/**
	 * Optional: info tooltip title/description/link (used when infoTooltipEnabled is true).
	 */
	infoTooltipText: '',
	infoTooltipDesc: '',
	infoTooltipLink: '',

	/**
	 * Optional: show imprint/privacy links (blank hides them).
	 */
	imprintUrl: '',
	privacyUrl: '',

	/**
	 * Optional: login page image URL (blank disables).
	 */
	loginImageURL: '',

	/**
	 * Optional: hide participants without video.
	 */
	hideNonVideo: false,

	/**
	 * Optional: hide local self view.
	 */
	hideSelfView: false,

	/**
	 * Optional: enable reactions sound effects.
	 */
	reactionsSoundEnabled: false,

	/**
	 * Optional: time (ms) reactions remain visible.
	 */
	reactionsTimeout: 10000,

	/**
	 * Optional: enable redux action logging (debug).
	 */
	reduxLoggingEnabled: false,

	/**
	 * Optional: enable p2p mode if supported by deployment.
	 */
	p2penabled: false,

	/**
	 * Audio preset name to use by default. Must exist in `audioPresets`.
	 */
	audioPreset: 'conference',

	/**
	 * Audio presets.
	 * Each preset defines WebRTC audio constraints and OPUS encoder settings.
	 */
	audioPresets: {
		// Default preset for meetings
		conference: {
			autoGainControl: true,
			echoCancellation: true,
			noiseSuppression: true,

			sampleRate: 48000,
			channelCount: 1,
			sampleSize: 16,

			opusStereo: false,
			opusDtx: false,
			opusFec: true,
			opusPtime: 20,
			opusMaxPlaybackRate: 48000
		},

		// Example: low-bandwidth preset
		low: {
			autoGainControl: true,
			echoCancellation: true,
			noiseSuppression: true,

			sampleRate: 16000,
			channelCount: 1,
			sampleSize: 16,

			opusStereo: false,
			opusDtx: true,
			opusFec: true,
			opusPtime: 20,
			opusMaxPlaybackRate: 16000
		}
	},

	/**
	 * Global audio constraint defaults (used by the currently selected preset).
	 * You typically don't need to override these if you use audioPresets.
	 */
	autoGainControl: true,
	echoCancellation: true,
	noiseSuppression: true,
	sampleRate: 48000,
	channelCount: 1,
	sampleSize: 16,

	/**
	 * OPUS defaults (used by the currently selected preset).
	 */
	opusStereo: false,
	opusDtx: false,
	opusFec: true,
	opusPtime: 20,
	opusMaxPlaybackRate: 48000,

	/**
	 * Optional: noise threshold used by parts of the UI.
	 */
	noiseThreshold: 0.2,

	/**
	 * Notification sound configuration.
	 */
	notificationSounds: {
		// Enable/disable all notification sounds
		enabled: true
	},

	/**
	 * ObserverRTC client-monitor configuration (if you use it).
	 */
	clientMontitor: {
		// enabled: false,
		// configUrl: ''
	},

	/**
	 * Document/UI title.
	 */
	title: 'edumeet',

	/**
	 * Theme/UI configuration (4.2+).
	 *
	 * This object is merged into the app's Material UI theme (ThemeOptions).
	 * You can override standard MUI theme fields, for example:
	 *
	 *	 palette: {
	 *		 primary: { main: '#1976d2' } // palette-primary-main
	 *	 }
	 */
	theme: {
		/**
		 * Background can be a CSS color/gradient.
		 */
		background:
			'linear-gradient(135deg, rgba(1,42,74,1) 0%, rgba(1,58,99,1) 50%, rgba(1,73,124,1) 100%)',

		/**
		 * Optional background image URL. If set, it is used as the page background image.
		 */
		backgroundImage: undefined,

		/**
		 * App bar background color.
		 */
		appBarColor: 'rgba(0, 0, 0, 0.4)',

		/**
		 * (4.2+) App bar text color.
		 */
		appBarTextColor: 'rgba(255, 255, 255, 1.0)',

		/**
		 * (4.2+) App bar icon color.
		 */
		appBarIconColor: 'rgba(255, 255, 255, 1.0)',

		/**
		 * Whether the app bar floats over the content.
		 */
		appBarFloating: true,

		/**
		 * (4.2+) Pre-call title background color.
		 */
		precallTitleColor: 'rgba(255, 255, 255, 1.0)',

		/**
		 * (4.2+) Pre-call title text color.
		 */
		precallTitleTextColor: 'rgba(0, 0, 0, 1.0)',

		/**
		 * (4.2+) Pre-call title icon color.
		 */
		precallTitleIconColor: 'rgba(0, 0, 0, 1.0)',

		/**
		 * Logo image URL.
		 */
		logo: 'images/logo.edumeet.svg',

		/**
		 * Border style for the active speaker tile.
		 */
		activeSpeakerBorder: '1px solid rgba(255, 255, 255, 1.0)',

		/**
		 * Background color for video tiles.
		 * (typo kept for compatibility: videoBackroundColor)
		 */
		videoBackroundColor: 'rgba(49, 49, 49, 0.9)',

		/**
		 * Fallback avatar image URL.
		 */
		videoAvatarImage: 'images/buddy.svg',

		/**
		 * Border radius used across the UI.
		 */
		roundedness: 10,

		/**
		 * Side panel item colors and container background.
		 */
		sideContentItemColor: 'rgba(255, 255, 255, 0.4)',
		sideContentItemDarkColor: 'rgba(150, 150, 150, 0.4)',
		sideContainerBackgroundColor: 'rgba(255, 255, 255, 0.7)',

		/**
		 * Example MUI theme override (uncomment to use):
		 */
		// palette: {
		//	 primary: { main: '#1976d2' } // palette-primary-main
		// }
	}
};