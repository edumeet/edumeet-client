import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ControlButton from './ControlButton';
import TextInputField from '../textinputfield/TextInputField';
import SettingsBadge from '../settingsbadge/SettingsBadge';
import { AutomationControl } from '../../utils/types';

describe('ControlButton', () => {
	it('marks a control with its name and state', () => {
		const html = renderToStaticMarkup(createElement(ControlButton, { control: 'mic', on: true, toolTip: 'Mute' }));

		expect(html).toContain('data-edumeet-control="mic"');
		expect(html).toContain('data-edumeet-on="true"');
	});

	it('reports a control without on as off', () => {
		const html = renderToStaticMarkup(createElement(ControlButton, { control: 'chat' }));

		expect(html).toContain('data-edumeet-on="false"');
	});

	it('carries a count', () => {
		const html = renderToStaticMarkup(createElement(ControlButton, { control: 'participants', count: 3 }));

		expect(html).toContain('data-edumeet-count="3"');
	});

	it('adds nothing to a button without a control', () => {
		const html = renderToStaticMarkup(createElement(ControlButton, { on: true, toolTip: 'Fullscreen' }));

		expect(html).not.toContain('data-edumeet');
	});
});

describe('SettingsBadge', () => {
	it('marks the badge with its control', () => {
		const html = renderToStaticMarkup(createElement(SettingsBadge, { control: 'reactions' }));

		expect(html).toContain('data-edumeet-control="reactions"');
	});

	it('adds nothing to a badge without a control', () => {
		const html = renderToStaticMarkup(createElement(SettingsBadge, {}));

		expect(html).not.toContain('data-edumeet');
	});
});

describe('TextInputField', () => {
	it('puts the control on the input element', () => {
		const html = renderToStaticMarkup(createElement(TextInputField, {
			label: 'Name', value: '', setValue: () => undefined, control: 'name'
		}));

		expect(html).toMatch(/<input[^>]*data-edumeet-control="name"/);
	});
});

const src = new URL('../../', import.meta.url);

const owners: Record<AutomationControl, string[]> = {
	'name': [ 'views/join/Join.tsx' ],
	'meeting-token': [ 'views/join/Join.tsx' ],
	'join': [ 'views/join/Join.tsx' ],
	'mic': [ 'components/controlbuttons/MicButton.tsx', 'components/controlbuttons/MicPreviewButton.tsx' ],
	'webcam': [ 'components/controlbuttons/WebcamButton.tsx', 'components/controlbuttons/WebcamPreviewButton.tsx' ],
	'screenshare': [ 'components/controlbuttons/ScreenshareButton.tsx' ],
	'raisehand': [ 'components/controlbuttons/RaiseHandButton.tsx' ],
	'reactions': [ 'components/controlbuttons/RaiseHandButton.tsx' ],
	'participants': [ 'components/controlbuttons/ParticipantsButton.tsx' ],
	'chat': [ 'components/controlbuttons/ChatButton.tsx' ],
	'leave': [ 'components/textbuttons/LeaveButton.tsx' ],
	'leave-confirm': [ 'components/textbuttons/LeaveButton.tsx' ],
	'leave-cancel': [ 'components/textbuttons/LeaveButton.tsx' ],
	'chat-input': [ 'components/chat/ChatInput.tsx' ],
	'chat-send': [ 'components/chat/ChatInput.tsx' ],
};

describe('the documented controls', () => {
	it.each(Object.entries(owners).flatMap(([ control, files ]) => files.map((file) => [ control, file ])))(
		'%s is set in %s',
		(control, file) => {
			const source = readFileSync(new URL(file, src), 'utf8');

			expect(source).toMatch(new RegExp(`(control|data-edumeet-control)='${control}'`));
		}
	);

	it('marks every reaction of the reactions menu', () => {
		const source = readFileSync(new URL('components/controlbuttons/RaiseHandButton.tsx', src), 'utf8');

		expect(source).toContain('data-edumeet-reaction={reaction.id}');
	});

	it('marks every video with its source', () => {
		const source = readFileSync(new URL('components/videoview/VideoView.tsx', src), 'utf8');

		expect(source).toContain('data-edumeet-video={consumer?.source ?? source}');
	});
});
