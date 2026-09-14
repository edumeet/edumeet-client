import type { ClientMonitor } from '@observertc/client-monitor-js';
import { useEffect, useState } from 'react';

/**
 * How many stats collecting rounds a problem has to survive before a passive
 * indicator announces it. Two rounds outlast the media gap of a peer joining or
 * leaving, which stops media briefly while transports and consumers are rebuilt.
 * The user's own-side problems wait one round longer, since that mark asks
 * them to do something about it.
 */
export const PROBLEM_INDICATOR_GRACE_ROUNDS = 2;
export const OWN_PROBLEM_GRACE_ROUNDS = 3;

/** Rounds expressed in the monitor's own period; zero without a monitor, where nothing is indicated anyway. */
export const graceMs = (monitor: ClientMonitor | undefined, rounds: number): number =>
	rounds * (monitor?.config.collectingPeriodInMs ?? 0);

/**
 * True once `active` has been continuously true for `delayMs`, and false again
 * the moment it drops. A zero delay passes the value straight through.
 */
export const useSustained = (active: boolean, delayMs: number): boolean => {
	const [ sustained, setSustained ] = useState(false);

	useEffect(() => {
		if (!active || delayMs <= 0) {
			setSustained(false);

			return;
		}

		const timer = setTimeout(() => setSustained(true), delayMs);

		return () => clearTimeout(timer);
	}, [ active, delayMs ]);

	return delayMs <= 0 ? active : sustained;
};
