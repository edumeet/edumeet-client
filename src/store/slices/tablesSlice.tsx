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
				{ id: 'SOt8gB', name: 'Mabelle Harrison' },
				{ id: '2T3Jzj', name: 'Lee Quinn' }
			]
		}, {
			id: 'Xuua4kS8JF',
			type: 'table',
			url: '/Xuua4kS8JF',
			users: [
				{ id: 'yclYGF', name: 'Edgar Owens' },
				{ id: 'XTPAbp', name: 'Jennie White' }
			]
		}, {
			id: '1dBPgn8dMZ',
			type: 'table',
			url: '/1dBPgn8dMZ',
			users: [
				{ id: 'x9WuzZ', name: 'Chase Rhodes' },
				{ id: 'cnQdzo', name: 'Travis Morris' }
			]
		}, {
			id: 'wx6I8MnMfM',
			type: 'table',
			url: '/wx6I8MnMfM',
			users: [
				{ id: '0BZ1AO', name: 'Harold Alvarado' },
				{ id: 't2HzQ3', name: 'Henrietta Knight' }
			]
		}, {
			id: 'kTdvIxaLo5',
			type: 'table',
			url: '/kTdvIxaLo5',
			users: [
				{ id: 'aVNxmd', name: 'Fred Johnson' },
				{ id: 'I2EJkH', name: 'Rosetta Simmons' }
			]
		}, {
			id: 'FmAEchvzbn',
			type: 'table',
			url: '/FmAEchvzbn',
			users: [
				{ id: '0OOONx', name: 'Dean Townsend' },
				{ id: '07mrv8', name: 'Fred Norman' }
			]
		}, {
			id: 'LExAn7wiTm',
			type: 'table',
			url: '/LExAn7wiTm',
			users: [
				{ id: 'hGYcjO', name: 'Keith Moran' },
				{ id: 'RM2vnL', name: 'Dennis Jacobs' },
				{ id: 'Iva Castillo', name: 'Lois Lopez' },
				{ id: 'Michael Brady', name: 'Lula Butler' },
				{ id: 'Daniel Lopez', name: 'Mathilda Sandoval' }
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