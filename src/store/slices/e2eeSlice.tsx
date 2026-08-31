import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { roomActions } from './roomSlice';

interface E2eeState {
	// peerId -> true once we've received that peer's media key (i.e. we can decrypt their
	// media and the pairwise secure channel is established). Drives the peer-list indicator.
	securedPeers: Record<string, boolean>;
	// peerId -> true if the peer's TOFU-pinned identity key later CHANGED (possible MITM).
	identityChangedPeers: Record<string, boolean>;
	// True once a frame has actually been encrypted, not merely once a transform was attached.
	// The room indicator is driven by this so it can never claim protection the media does not have.
	encryptionVerified: boolean;
}

const initialState: E2eeState = {
	securedPeers: {},
	identityChangedPeers: {},
	encryptionVerified: false,
};

const e2eeSlice = createSlice({
	name: 'e2ee',
	initialState,
	reducers: {
		setEncryptionVerified: ((state, action: PayloadAction<boolean>) => {
			state.encryptionVerified = action.payload;
		}),
		setPeerSecured: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.securedPeers[action.payload.peerId] = true;
		}),
		setPeerIdentityChanged: ((state, action: PayloadAction<{ peerId: string }>) => {
			state.identityChangedPeers[action.payload.peerId] = true;
		}),
		removePeer: ((state, action: PayloadAction<{ peerId: string }>) => {
			delete state.securedPeers[action.payload.peerId];
			delete state.identityChangedPeers[action.payload.peerId];
		}),
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return initialState;
			});
	}
});

export const e2eeActions = e2eeSlice.actions;
export default e2eeSlice;
