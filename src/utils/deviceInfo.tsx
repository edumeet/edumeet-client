import bowser from 'bowser';

export const browserInfo = bowser.getParser(navigator.userAgent);

export interface DeviceInfo {
	flag: 'chrome' | 'firefox' | 'safari' | 'opera' | 'edge' | 'unknown';
	os: string; // ios, android, linux...
	platform: string; // mobile, desktop, tablet
	name: string;
	version: string;
}

export const supportedBrowsers = {
	'windows': {
		'internet explorer': '>12',
		'microsoft edge': '>18',
	},
	'safari': '>12',
	'firefox': '>=60',
	'chrome': '>=74',
	'chromium': '>=74',
	'opera': '>=62',
	'samsung internet for android': '>=11.1.1.52',
};

export const deviceInfo = (): DeviceInfo => {
	let flag;

	if (browserInfo.satisfies({ chrome: '>=0', chromium: '>=0' }))
		flag = 'chrome';
	else if (browserInfo.satisfies({ firefox: '>=0' }))
		flag = 'firefox';
	else if (browserInfo.satisfies({ safari: '>=0' }))
		flag = 'safari';
	else if (browserInfo.satisfies({ opera: '>=0' }))
		flag = 'opera';
	else if (browserInfo.satisfies({ 'microsoft edge': '>=0' }))
		flag = 'edge';
	else
		flag = 'unknown';

	return {
		flag,
		os: browserInfo.getOSName(true), // ios, android, linux...
		platform: browserInfo.getPlatformType(true), // mobile, desktop, tablet
		name: browserInfo.getBrowserName(true),
		version: browserInfo.getBrowserVersion()
	} as DeviceInfo;
};