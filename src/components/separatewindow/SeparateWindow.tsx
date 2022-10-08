import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import {
	ReactNode,
	ReactPortal,
	useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { useConstant } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';

interface SeparateWindowProps {
	onClose?: () => void;
	aspectRatio?: number;
	children?: ReactNode;
}

const SeparateWindow = ({
	onClose,
	aspectRatio,
	children
}: SeparateWindowProps): ReactPortal => {
	const containerEl = useConstant(() => document.createElement('div'));
	const cache = useConstant(() =>
		createCache({ key: 'external', container: containerEl })
	);

	useEffect(() => {
		const externalWindow = window.open(
			'',
			edumeetConfig.title,
			`width=800,height=${800 / (aspectRatio || 1.3333)},left=200,top=200`
		);

		externalWindow?.document.body.appendChild(containerEl);
		externalWindow?.addEventListener('beforeunload', () => onClose?.());

		return () => externalWindow?.close();
	}, []);

	return createPortal(
		<CacheProvider value={cache}> {children}</CacheProvider>,
		containerEl
	);
};

export default SeparateWindow;