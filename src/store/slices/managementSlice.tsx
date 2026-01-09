import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RoleOptionTypes, TenantOptionTypes } from '../../utils/types';
export interface ManagementState {
	//  name: string;
	username: string;
	email: string;
	avatar: string;
	tenantAdmin: boolean;
	tenantOwner: boolean;
	superAdmin: boolean;
	tenants: TenantOptionTypes;
	roles: RoleOptionTypes;
	
	/* defaults: 
	tenants: []
	groups: []
	roles: []
	rooms: [] */
	/* tenants
	rooms */
	
}

const initialState: ManagementState = {
	// name: '',
	username: '',
	email: '',
	avatar: '',
	tenantAdmin: false,
	tenantOwner: false,
	superAdmin: false,
	tenants: [],
	roles: [],

	/* 
	defaults: []
	tenants: []
	groups: []
	roles: []
	rooms: [] */
};

const managementSlice = createSlice({
	name: 'management',
	initialState,
	reducers: {
		clearUser: ((state) => {
			state.username = '';
			state.username = '';
			state.email = '';
			state.avatar = '';
			state.tenantAdmin = false;
			state.tenantOwner = false;
			state.superAdmin = false;
		}),
		setUsername: ((state, action: PayloadAction<string>) => {
			state.username = action.payload ?? '';
		}),
		setEmail: ((state, action: PayloadAction<string>) => {
			state.email = action.payload ?? '';
		}),
		setAvatar: ((state, action: PayloadAction<string>) => {
			state.avatar = action.payload ?? '';
		}),
		setTenantAdmin: ((state, action: PayloadAction<boolean>) => {
			state.tenantAdmin = action.payload ?? false;
		}),
		setTenantOwner: ((state, action: PayloadAction<boolean>) => {
			state.tenantOwner = action.payload ?? false;
		}),
		setSuperAdmin: ((state, action: PayloadAction<boolean>) => {
			state.superAdmin = action.payload || false;
		}),
		setTenants: ((state, action: PayloadAction<TenantOptionTypes>) => {
			state.tenants = action.payload || [ ];
		}),
		setRoles: ((state, action: PayloadAction<RoleOptionTypes>) => {
			state.roles = action.payload || [ ];
		}),
	},
});

export const managamentActions = managementSlice.actions;
export default managementSlice;
