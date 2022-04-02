import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Permission, Role } from '../../utils/roles';

export interface PermissionsState {
	roles: number[]; // Role IDs
	loginEnabled?: boolean;
	loggedIn?: boolean;
	locked?: boolean;
	signInRequired?: boolean;
	userRoles?: Record<number, Role>;
	roomPermissions?: Record<string, Role[]>;
	allowWhenRoleMissing?: Permission[];
}

const initialState: PermissionsState = {
	roles: [],
	loginEnabled: true,
	loggedIn: false,
	locked: false,
	signInRequired: false,
};

const permissionsSlice = createSlice({
	name: 'permissions',
	initialState,
	reducers: {
		addRoles: ((state, action: PayloadAction<number[]>) => {
			state.roles = action.payload;
		}),
		addRole: ((state, action: PayloadAction<number>) => {
			state.roles.push(action.payload);
		}),
		removeRole: ((state, action: PayloadAction<number>) => {
			state.roles =
				state.roles.filter((role) => role !== action.payload);
		}),
		setLoginEnabled: ((state, action: PayloadAction<boolean>) => {
			state.loginEnabled = action.payload;
		}),
		setLoggedIn: ((state, action: PayloadAction<boolean>) => {
			state.loggedIn = action.payload;
		}),
		setLocked: ((state, action: PayloadAction<boolean>) => {
			state.locked = action.payload;
		}),
		setSignInRequired: ((state, action: PayloadAction<boolean>) => {
			state.signInRequired = action.payload;
		}),
		setUserRoles: ((state, action: PayloadAction<Record<number, Role>>) => {
			state.userRoles = action.payload;
		}),
		setRoomPermissions: ((state, action: PayloadAction<Record<Permission, Role[]>>) => {
			state.roomPermissions = action.payload;
		}),
		setAllowWhenRoleMissing: ((state, action: PayloadAction<Permission[]>) => {
			state.allowWhenRoleMissing = action.payload;
		}),
	},
});

export const permissionsActions = permissionsSlice.actions;
export default permissionsSlice;