import { useAppSelector } from '../../store/hooks';
import {
	connectivityCandidatesHintLabel,
	connectivityCandidatesLabel,
	connectivityDtlsHintLabel,
	connectivityDtlsLabel,
	connectivityIcePathHintLabel,
	connectivityIcePathLabel,
	connectivityInboundHintLabel,
	connectivityInboundLabel,
	connectivityOutboundHintLabel,
	connectivityOutboundLabel,
	connectivityStunHintLabel,
	connectivityStunLabel,
} from '../translated/translatedComponents';
import { ConnectivityCheckId } from './connectivityReport';

export type ConnectivityLabels = {
	// Name of each step, as shown in the dialog.
	checks: Record<ConnectivityCheckId, string>;
	// What it most likely means when that step is the first one failing.
	hints: Record<ConnectivityCheckId, string>;
};

/**
 * The wording of the connectivity checks, shared by the dialog and the top bar
 * indicator so a failing step is named identically in both.
 *
 * The strings come from `translatedComponents` (and therefore from
 * `src/translations/*.json`, falling back to English where a locale has no
 * entry). Subscribing to the locale is what re-renders the caller when the
 * language changes, since `intl` there is a module singleton.
 */
export const useConnectivityLabels = (): ConnectivityLabels => {
	useAppSelector((state) => state.settings.locale);

	return {
		checks: {
			candidates: connectivityCandidatesLabel(),
			stun: connectivityStunLabel(),
			icePath: connectivityIcePathLabel(),
			dtls: connectivityDtlsLabel(),
			outbound: connectivityOutboundLabel(),
			inbound: connectivityInboundLabel(),
		},
		hints: {
			candidates: connectivityCandidatesHintLabel(),
			stun: connectivityStunHintLabel(),
			icePath: connectivityIcePathHintLabel(),
			dtls: connectivityDtlsHintLabel(),
			outbound: connectivityOutboundHintLabel(),
			inbound: connectivityInboundHintLabel(),
		},
	};
};
