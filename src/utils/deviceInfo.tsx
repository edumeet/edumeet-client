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
	'safari': '>=16.4',
	'firefox': '>=110',
	'chrome': '>=110',
	'chromium': '>=110',
	'opera': '>=96',
	'edge': '>=110',
	'samsung internet for android': '>=20',
	'vivaldi': '>=6.0',
	'uc browser': '>=13',
	'naver whale browser': '>=3',
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
	else if (browserInfo.satisfies({ edge: '>=0' }))
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