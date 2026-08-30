import { useEffect } from 'react';
import { Logger } from './Logger';

const logger = new Logger('WakeLock');

export const useWakeLock = (active: boolean): void => {
	useEffect(() => {
		if (!active) return;

		if (!('wakeLock' in navigator)) {
			logger.debug('not supported by this browser');

			return;
		}

		let sentinel: WakeLockSentinel | undefined;
		let acquiring = false;
		let stopped = false;

		// The browser drops the lock every time the page is hidden and never takes it
		// back on its own, so the release event and visibilitychange both have to re-ask.
		const acquire = async (): Promise<void> => {
			if (stopped || acquiring || sentinel || document.visibilityState !== 'visible') {
				logger.debug(
					'acquire() skipped [stopped:%s, acquiring:%s, held:%s, visibility:%s]',
					stopped, acquiring, Boolean(sentinel), document.visibilityState
				);

				return;
			}

			acquiring = true;

			try {
				const newSentinel = await navigator.wakeLock.request('screen');

				if (stopped) {
					logger.debug('acquire() stopped while requesting, releasing');

					await newSentinel.release();

					return;
				}

				sentinel = newSentinel;
				sentinel.addEventListener('release', onRelease);

				logger.debug('acquire() succeeded');
			} catch (error) {
				logger.debug('acquire() failed [error:%o]', error);
			} finally {
				acquiring = false;
			}
		};

		const onRelease = (): void => {
			logger.debug('released by the browser [visibility:%s]', document.visibilityState);

			sentinel = undefined;

			acquire();
		};

		const onVisibilityChange = (): void => {
			logger.debug('visibilitychange [visibility:%s, held:%s]', document.visibilityState, Boolean(sentinel));

			if (document.visibilityState === 'visible') acquire();
		};

		logger.debug('starting');

		document.addEventListener('visibilitychange', onVisibilityChange);
		acquire();

		return () => {
			logger.debug('stopping [held:%s]', Boolean(sentinel));

			stopped = true;

			document.removeEventListener('visibilitychange', onVisibilityChange);
			sentinel?.removeEventListener('release', onRelease);
			sentinel?.release().catch((error: unknown) => logger.debug('release() failed [error:%o]', error));
			sentinel = undefined;
		};
	}, [ active ]);
};
