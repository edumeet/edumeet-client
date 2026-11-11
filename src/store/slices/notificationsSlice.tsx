import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SnackbarKey } from 'notistack';
import { roomActions } from './roomSlice';
import { v4 as uuid } from 'uuid';
import { peersActions } from './peersSlice';
import { peerSentReactionLabel } from '../../components/translated/translatedComponents';
import { reactionEmojis, reactionEntry } from '../../utils/reactions';

export interface Notification {
	key: SnackbarKey;
	message: string;
	options?: {
		variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
		persist?: boolean;
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
		}),
		playTestSound: () => {}
	},
	extraReducers: (builder) => {
		builder
			.addCase(roomActions.setState, (_state, action) => {
				if (action.payload === 'left')
					return [];
			})
			.addCase(peersActions.updatePeer, (state, action) => {
				const { displayName, reaction } = action.payload;

				const emoji = reactionEntry(reactionEmojis, reaction);

				if (emoji) {
					state.push({
						key: uuid(),
						message: peerSentReactionLabel(typeof displayName === 'string' && displayName ? displayName : 'Someone', emoji),
					});
				}
			});
	}
});

export const notificationsActions = notificationsSlice.actions;
export default notificationsSlice;