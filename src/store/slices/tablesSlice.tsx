import { createSlice } from '@reduxjs/toolkit';

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
	current: string;
	list: Table[];
};

const initialState: TablesState = {
	created: false,
	current: 'Dgmd4ZuN',
	list: [
		{
			id: 'dbP8JnNX',
			type: 'table',
			url: '/dbP8JnNX',
			users: [
				{ id: 'wvkCVw', name: 'Lina Goodman' },
				{ id: 'fQCHgv', name: 'Mae Richardson' }
			]
		},
		{
			id: 'ug5b9Hof',
			type: 'table',
			url: '/ug5b9Hof',
			users: [
				{ id: 'dRujJs', name: 'Beatrice Peterson' },
				{ id: '6SAtgW', name: 'Harvey Brewer' }
			]
		},
		{
			id: '6FLbjJLB',
			type: 'table',
			url: '/6FLbjJLB',
			users: [
			]
		}, {
			id: 'CnQMldMC',
			type: 'table',
			url: '/CnQMldMC',
			users: [
				{ id: 'OAJM8q', name: 'Bertie Fisher' },
				{ id: 'GwocyW', name: 'Walter Stewart' }
			]
		}, {
			id: 'Dgmd4ZuN',
			type: 'table',
			url: '/Dgmd4ZuN',
			users: [
				{ id: '2BqeHD', name: 'Jeremy Jenkins' },
				{ id: 'yaeRIr', name: 'Marion Castro' },
				{ id: 'jfhkp9', name: 'Glenn Joseph' },
				{ id: 'jwPGQQ', name: 'Alejandro Vargas' },
				{ id: '7j2DYi', name: 'Calvin Yates' }
			]
		}, {
			id: '39xuRwtg',
			type: 'table',
			url: '/39xuRwtg',
			users: [
				{ id: 'SOt8gB', name: 'Mabelle Harrison' },
				{ id: '2T3Jzj', name: 'Lee Quinn' }
			]
		}, {
			id: 'Xuua4kS8',
			type: 'table',
			url: '/Xuua4kS8',
			users: [
				{ id: 'yclYGF', name: 'Edgar Owens' },
				{ id: 'XTPAbp', name: 'Jennie White' }
			]
		}, {
			id: '1dBPgn8d',
			type: 'table',
			url: '/1dBPgn8d',
			users: [
				{ id: 'x9WuzZ', name: 'Chase Rhodes' },
				{ id: 'cnQdzo', name: 'Travis Morris' }
			]
		}, {
			id: 'wx6I8MnM',
			type: 'table',
			url: '/wx6I8MnM',
			users: [
				{ id: '0BZ1AO', name: 'Harold Alvarado' },
				{ id: 't2HzQ3', name: 'Henrietta Knight' }
			]
		}, {
			id: 'kTdvIxaL',
			type: 'table',
			url: '/kTdvIxaL',
			users: [
				{ id: 'RKjNLY', name: 'Fred Johnson' },
				{ id: '0GexJE', name: 'Rosetta Simmons' }
			]
		}, {
			id: 'FmAEchvz',
			type: 'table',
			url: '/FmAEchvz',
			users: [
				{ id: '0OOONx', name: 'Dean Townsend' },
				{ id: '07mrv8', name: 'Fred Norman' }
			]
		}, {
			id: 'LExAn7wi',
			type: 'table',
			url: '/LExAn7wi',
			users: [
				{ id: 'hGYcjO', name: 'Keith Moran' },
				{ id: 'RM2vnL', name: 'Dennis Jacobs' },
				{ id: 'nyMbqa', name: 'Lois Lopez' },
				{ id: '1FoGzn', name: 'Lula Butler' },
				{ id: 'YFF6D5', name: 'Mathilda Sandoval' }
			]
		}
	]
};

const tablesSlice = createSlice({
	name: 'tables',
	initialState,
	reducers: {
		createTables: ((state) => {
			state.created = true;
		}),
		closeTablesSession: ((state) => {
			state.created = false;

		})
	}
});

export const tablesActions = tablesSlice.actions;
export default tablesSlice;