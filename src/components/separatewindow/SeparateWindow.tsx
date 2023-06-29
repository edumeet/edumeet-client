import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import {
	PropsWithChildren,
	ReactNode,
	ReactPortal,
	useEffect,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useConstant } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';

interface SeparateWindowProps extends PropsWithChildren {
	onClose?: () => void;
	aspectRatio?: number;
	children?: ReactNode;
	title?: string;
}

const SeparateWindow = ({
	title = edumeetConfig.title || 'Edumeet',
	children,
	onClose,
	aspectRatio = 16 / 9,
}: SeparateWindowProps): ReactPortal | null => {
	const titleEl = useConstant(() => document.createElement('title'));
	const containerEl = useConstant(() => document.createElement('div'));

	const cache = useConstant(() =>
		createCache({ key: 'external', container: containerEl })
	);

	const [ isOpened, setOpened ] = useState(false);

	useEffect(() => {
		const externalWindow = window.open(
			'',
			'',
			`width=800,height=${800 / (aspectRatio)},left=200,top=200,scrollbars=on,resizable=on,dependent=on,menubar=off,toolbar=off,location=off`
		);

		// if window.open fails
		if (!externalWindow) {
			onClose?.();

			return;
		}

		setTimeout(() => externalWindow.addEventListener('beforeunload', () => onClose?.()), 0);

		externalWindow.document.body.style.margin = '0';
		externalWindow.document.head.appendChild(titleEl);
		externalWindow.document.body.appendChild(containerEl);

		setOpened(true);

		return () => externalWindow.close();
	}, []);

	useEffect(() => {
		titleEl.innerText = title;
	}, [ title, titleEl ]);

	return isOpened ? createPortal(<CacheProvider value={cache}>{ children }</CacheProvider>, containerEl) : null;
};

export default SeparateWindow;