import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Table } from '../../utils/types';
// import { peersActions } from './peersSlice';
// import { roomActions } from './roomSlice';

type Table = {
	id: string;
	type: string;
	url: string;
	users: User[];
};

type User = {
	id: string;
	name: string;
};

type TablesState = {
	created: boolean;
	// tablesViewOpened: boolean;
	expanded: boolean;
	current: string;
	list: Table[];
};

const initialState: TablesState = {
	created: true,
	// tablesViewOpened: false,
	expanded: false,
	current: 'CnQMldMC8u',
	list: [
		{
			id: 'dbP8JnNXGY',
			type: 'table',
			url: '/dbP8JnNXGY',
			users: [
				{ id: 'wvkCVw', name: 'Lina Goodman' },
				{ id: 'fQCHgv', name: 'Mae Richardson' }
			]
		},
		{
			id: 'ug5b9Hof72',
			type: 'table',
			url: '/ug5b9Hof72',
			users: [
				{ id: 'dRujJs', name: 'Beatrice Peterson' },
				{ id: '6SAtgW', name: 'Harvey Brewer' }
			]
		},
		{
			id: '6FLbjJLBEJ',
			type: 'table',
			url: '/6FLbjJLBEJ',
			users: [
			]
		}, {
			id: 'CnQMldMC8u',
			type: 'table',
			url: '/CnQMldMC8u',
			users: [
				{ id: 'OAJM8q', name: 'Bertie Fisher' },
				{ id: 'GwocyW', name: 'Walter Stewart' }
			]
		}, {
			id: 'Dgmd4ZuNO9',
			type: 'table',
			url: '/Dgmd4ZuNO9',
			users: [
				{ id: '2BqeHD', name: 'Jeremy Jenkins' },
				{ id: 'yaeRIr', name: 'Marion Castro' },
				{ id: 'jfhkp9', name: 'Glenn Joseph' },
				{ id: 'jwPGQQ', name: 'Alejandro Vargas' },
				{ id: '7j2DYi', name: 'Calvin Yates' }
			]
		}, {
			id: '39xuRwtgMh',
			type: 'table',
			url: '/39xuRwtgMh',
			users: [
				{ id: 'SOt8gB', name: 'Shawn Meyer' },
				{ id: '2T3Jzj', name: 'Maud Todd' }
			]
		}, {
			id: '39xuRwtgMh',
			type: 'table',
			url: '/39xuRwtgMh',
			users: [
				{ id: 'SOt8gB', name: 'Shawn Meyer' },
				{ id: '2T3Jzj', name: 'Maud Todd' }
			]
		}, {
			id: '39xuRwtgMh',
			type: 'table',
			url: '/39xuRwtgMh',
			users: [
				{ id: 'SOt8gB', name: 'Shawn Meyer' },
				{ id: '2T3Jzj', name: 'Maud Todd' }
			]
		}, {
			id: '39xuRwtgMh',
			type: 'table',
			url: '/39xuRwtgMh',
			users: [
				{ id: 'SOt8gB', name: 'Shawn Meyer' },
				{ id: '2T3Jzj', name: 'Maud Todd' }
			]
		}, {
			id: '39xuRwtgMh',
			type: 'table',
			url: '/39xuRwtgMh',
			users: [
				{ id: 'SOt8gB', name: 'Shawn Meyer' },
				{ id: '2T3Jzj', name: 'Maud Todd' }
			]
		}
		
	]
};

const tablesSlice = createSlice({
	name: 'tables',
	initialState,
	reducers: {
		createTablesSession: ((state, action: PayloadAction<Table>) => {
			state.created = true;
		}),
		closeTablesSession: ((state, action: PayloadAction<Table[]>) => {
			state.created = false;

		}),
		expandTablesSession: ((state, action: PayloadAction<Table[]>) => {
			// return [ ...state, ...action.payload ];
		}),
		
		collapseTablesSession: ((state, action: PayloadAction<Table[]>) => {
			// return [ ...state, ...action.payload ];
		})
	},
	// extraReducers: (builder) => {
	// 	builder
	// 		.addCase(peersActions.updatePeer, (state, action) => {
	// 			if (action.payload.displayName) {
	// 				const { id, displayName } = action.payload;

	// 				return state.map((message) => {
	// 					if (message.peerId === id)
	// 						return { ...message, displayName };

	// 					return message;
	// 				});
	// 			}
	// 		})
	// 		.addCase(roomActions.setState, (_state, action) => {
	// 			if (action.payload === 'left')
	// 				return [];
	// 		});
	// }
});

export const tablesActions = tablesSlice.actions;
export default tablesSlice;