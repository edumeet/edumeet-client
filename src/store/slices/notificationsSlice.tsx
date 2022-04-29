import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SnackbarKey } from 'notistack';
import { roomActions } from './roomSlice';
import { v4 as uuid } from 'uuid';
import { peersActions } from './peersSlice';
import { joinedRoomLabel, peerJoinedRoomLabel } from '../../components/translated/translatedComponents';

export interface Notification {
	key: SnackbarKey;
	message: string;
	options?: {
		variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
	};
}

type NotificationsState = Notification[];

const initialState: NotificationsState = [];

const notificationsSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		enqueueNotification: ((state, action: PayloadAction<Notification>) => {
			state.push(action.payload);
		}),
		removeNotification: ((state, action: PayloadAction<SnackbarKey>) => {
			return state.filter((notification) => notification.key !== action.payload);
		})
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.updateRoom, (state, action) => {
				if (action.payload.joined) {
					state.push({
						key: uuid(),
						message: joinedRoomLabel(),
						options: { variant: 'success' }
					});
				}
			})
			.addCase(peersActions.addPeer, (state, action) => {
				const { displayName } = action.payload;

				if (displayName) {
					state.push({
						key: uuid(),
						message: peerJoinedRoomLabel(displayName),
						options: { variant: 'success' }
					});
				} else {
					state.push({
						key: uuid(),
						message: 'A new user joined the room', // TODO: translate
						options: { variant: 'success' }
					});
				}
			});
	}
});

export const notificationsActions = notificationsSlice.actions;
export default notificationsSlice;