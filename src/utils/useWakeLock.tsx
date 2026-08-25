import { useEffect } from 'react';
import { Logger } from './Logger';

const logger = new Logger('WakeLock');

export const useWakeLock = (active: boolean): void => {
	useEffect(() => {
		if (!active || !('wakeLock' in navigator)) return;

		let sentinel: WakeLockSentinel | undefined;
		let acquiring = false;
		let stopped = false;

		// The browser drops the lock every time the page is hidden and never takes it
		// back on its own, so the release event and visibilitychange both have to re-ask.
		const acquire = async (): Promise<void> => {
			if (stopped || acquiring || sentinel || document.visibilityState !== 'visible') return;

			acquiring = true;

			try {
				const newSentinel = await navigator.wakeLock.request('screen');

				if (stopped) {
					await newSentinel.release();

					return;
				}

				sentinel = newSentinel;
				sentinel.addEventListener('release', onRelease);
			} catch (error) {
				logger.debug('acquire() failed [error:%o]', error);
			} finally {
				acquiring = false;
			}
		};

		const onRelease = (): void => {
			sentinel = undefined;

			acquire();
		};

		const onVisibilityChange = (): void => {
			if (document.visibilityState === 'visible') acquire();
		};

		document.addEventListener('visibilitychange', onVisibilityChange);
		acquire();

		return () => {
			stopped = true;

			document.removeEventListener('visibilitychange', onVisibilityChange);
			sentinel?.removeEventListener('release', onRelease);
			sentinel?.release().catch((error: unknown) => logger.debug('release() failed [error:%o]', error));
			sentinel = undefined;
		};
	}, [ active ]);
};
