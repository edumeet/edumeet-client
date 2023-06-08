import Join from './Join';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
jest.mock('../../services/mediaService');
jest.mock('../../services/signalingService');
/* eslint-disable @typescript-eslint/no-non-null-assertion */

test('Should update name field', async () => {
	// eslint-disable-next-line
	const { store } = require('../../store/store');

	render(<Provider store={store} ><Join roomId='test' /></Provider>);

	await act(() => Promise.resolve());
	const field = screen.getByTestId('name-input').querySelector('input');

	expect(field).toBeInTheDocument();
	fireEvent.change(field!, { target: { value: 'MyName' } });
	expect(field!.value).toBe('MyName');

});

test('Should set name on join', async () => {
	// eslint-disable-next-line
	const { store } = require('../../store/store');

	render(<Provider store={store} ><Join roomId='test' /></Provider>);

	await act(() => Promise.resolve());
	const field = screen.getByTestId('name-input').querySelector('input');
	const joinBtn = screen.getByTestId('join-button') as HTMLButtonElement;

	expect(field).toBeInTheDocument();
	fireEvent.change(field!, { target: { value: 'MyName' } });
	fireEvent.click(joinBtn);
	expect(store.getState().settings.displayName).toBe('MyName');
});

test('Should push url state to history on headless', async () => {
	// eslint-disable-next-line
	const { store } = require('../../store/store');
	const url = 'http://localhost/test?headless=true';

	Reflect.deleteProperty(global.window, 'location');
	Object.defineProperty(window, 'location', {
		value: {
			href: url
		},
		writable: true
	});

	const spy = jest.spyOn(window.history, 'pushState');

	render(<Provider store={store} ><Join roomId='test' /></Provider>);

	await act(() => Promise.resolve());

	expect(spy).toHaveBeenCalledWith({}, '', url.split('?')[0]);
	expect(spy).toHaveBeenCalledTimes(1);
});

test('Should set displayName from searchparams', async () => {
	const url = 'http://localhost/test?displayName=testname';
	// eslint-disable-next-line
	const { store } = require('../../store/store');
	expect(store.getState().settings.displaytName).toBe(undefined);

	Reflect.deleteProperty(global.window, 'location');
	Object.defineProperty(window, 'location', {
		value: {
			href: url
		},
		writable: true
	});
	render(<Provider store={store} ><Join roomId='test' /></Provider>);

	await act(() => Promise.resolve());
	expect(store.getState().settings.displayName).toBe('testname');
});
