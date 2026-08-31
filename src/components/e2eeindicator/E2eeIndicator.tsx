import { Tooltip } from '@mui/material';
import { memo } from 'react';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { useAppSelector } from '../../store/hooks';
import {
	endToEndEncryptedLabel,
	roomE2eeSecuringLabel,
	peerE2eeSecuringLabel,
	peerIdentityChangedShortLabel,
} from '../translated/translatedComponents';

interface E2eeIndicatorProps {
	// Per-peer variant (peer list): shows key-receipt state. Omit `peer` for the room-level badge.
	peer?: boolean;
	peerSecured?: boolean;
	identityChanged?: boolean;
	small?: boolean;
}

// Passive end-to-end-encryption status icon (a shield, deliberately NOT a padlock so it can't be
// confused with the room-lock button). Room-level badge by default; per-peer variant with `peer`.
//
// E2EE is a room-wide mandate: a browser that cannot encrypt is refused at the lobby, so every peer
// present is encrypted. A per-peer "secured" shield therefore states something that is true of the
// whole room and can never differ, which teaches people to read a badge that carries no information.
// The peer variant renders ONLY the two states that genuinely vary per peer: their key has not
// arrived yet, or their pinned identity changed. Steady state shows nothing.
const E2eeIndicator = ({
	peer = false,
	peerSecured = false,
	identityChanged = false,
	small = false,
}: E2eeIndicatorProps): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale); // re-render the tooltip on language change
	// Attachment is not encryption. Until a frame has actually been encrypted we must not show the
	// room as protected, or the badge repeats the exact claim we cannot yet stand behind.
	const verified = useAppSelector((state) => state.e2ee.encryptionVerified);

	const fontSize = small ? 'small' : 'medium';

	if (!peer) {
		// The two states are told apart by the glyph, not by colour: the app bar styles every descendant
		// `.MuiSvgIcon-root`, which outranks MUI's colour props, and a shape difference reads the same
		// for everyone regardless of how colour is perceived. Both icons take the app bar's own colour.
		return verified ? (
			<Tooltip title={endToEndEncryptedLabel()}>
				<GppGoodOutlinedIcon fontSize={fontSize} />
			</Tooltip>
		) : (
			<Tooltip title={roomE2eeSecuringLabel()}>
				<GppMaybeOutlinedIcon fontSize={fontSize} />
			</Tooltip>
		);
	}

	// TOFU violation takes precedence — a changed identity is the thing the user must see.
	if (identityChanged) {
		return (
			<Tooltip title={peerIdentityChangedShortLabel()}>
				<GppBadOutlinedIcon fontSize={fontSize} color='error' />
			</Tooltip>
		);
	}

	if (peerSecured) return null;

	return (
		<Tooltip title={peerE2eeSecuringLabel()}>
			<GppMaybeOutlinedIcon fontSize={fontSize} color='disabled' />
		</Tooltip>
	);
};

export default memo(E2eeIndicator);
