import bowser from 'bowser';

export interface DeviceInfo {
	flag: 'chrome' | 'firefox' | 'safari' | 'opera' | 'edge' | 'unknown';
	os: string; // ios, android, linux...
	platform: string; // mobile, desktop, tablet
	name: string;
	version: string;
	bowser: bowser.Parser.Parser;
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

export const deviceInfo = () => {
	const ua = navigator.userAgent;
	const bowserInstance = bowser.getParser(ua);

	let flag;

	if (bowserInstance.satisfies({ chrome: '>=0', chromium: '>=0' }))
		flag = 'chrome';
	else if (bowserInstance.satisfies({ firefox: '>=0' }))
		flag = 'firefox';
	else if (bowserInstance.satisfies({ safari: '>=0' }))
		flag = 'safari';
	else if (bowserInstance.satisfies({ opera: '>=0' }))
		flag = 'opera';
	else if (bowserInstance.satisfies({ 'microsoft edge': '>=0' }))
		flag = 'edge';
	else
		flag = 'unknown';

	return {
		flag,
		os: bowserInstance.getOSName(true), // ios, android, linux...
		platform: bowserInstance.getPlatformType(true), // mobile, desktop, tablet
		name: bowserInstance.getBrowserName(true),
		version: bowserInstance.getBrowserVersion(),
		bowser: bowserInstance,
	} as DeviceInfo;
};
