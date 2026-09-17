import { useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';

export type DocumentStatus = Record<'data-edumeet-state' | 'data-edumeet-connection' | 'data-edumeet-reason', string | undefined>;

// Fixed codes only. Nothing here may ever carry a name, an id, a token or a
// message, because anything on the document root is readable by whatever else
// runs in the page.
export const documentStatus = (state: RootState): DocumentStatus => ({
	'data-edumeet-state': state.room.state,
	'data-edumeet-connection': state.signaling.state,
	'data-edumeet-reason': state.room.leaveReason,
});

export const applyDocumentStatus = (root: Element, status: DocumentStatus): void => {
	for (const [ name, value ] of Object.entries(status)) {
		if (value) root.setAttribute(name, value);
		else root.removeAttribute(name);
	}
};

export const useDocumentStatus = (): void => {
	const status = useAppSelector(documentStatus, shallowEqual);

	useEffect(() => applyDocumentStatus(document.documentElement, status), [ status ]);
};
