import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SnackbarKey } from 'notistack';
import { roomActions } from './roomSlice';
import { v4 as uuid } from 'uuid';
import { peersActions } from './peersSlice';
import { peerJoinedRoomLabel } from '../../components/translated/translatedComponents';

export interface Notification {
	key: SnackbarKey;
	message: string;
	options?: {
		variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
	};
}

type NotificationUpdate = Omit<Notification, 'key'>;

type NotificationsState = Notification[];

const initialState: NotificationsState = [];

const notificationsSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		enqueueNotification: ((state, action: PayloadAction<NotificationUpdate>) => {
			state.push({ ...action.payload, key: uuid() });
		}),
		removeNotification: ((state, action: PayloadAction<SnackbarKey>) => {
			return state.filter((notification) => notification.key !== action.payload);
		})
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return [];
			})
			.addCase(peersActions.addPeer, (state, action) => {
				const { displayName } = action.payload;

				if (displayName) {
					state.push({
						key: uuid(),
						message: peerJoinedRoomLabel(displayName),
					});
				} else {
					state.push({
						key: uuid(),
						message: peerJoinedRoomLabel('Someone'), // TODO: translate
					});
				}
			});
	}
});

export const notificationsActions = notificationsSlice.actions;
export default notificationsSlice;