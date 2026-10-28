import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import {
	PropsWithChildren,
	ReactNode,
	ReactPortal,
	useMemo,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector, useConstant } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import { getDirection } from '../../utils/direction';

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

	const locale = useAppSelector((state) => state.settings.locale);
	const direction = getDirection(locale);
	const cache = useMemo(() => createCache({
		key: `external-${direction}`,
		container: containerEl,
		stylisPlugins: direction === 'rtl' ? [ rtlPlugin ] : [],
	}), [ containerEl, direction ]);

	const [ isOpened, setOpened ] = useState(false);
	const externalWindowRef = useRef<Window | null>(null);

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
		externalWindowRef.current = externalWindow;

		setOpened(true);

		return () => {
			externalWindowRef.current = null;
			externalWindow.close();
		};
	}, []);

	useEffect(() => {
		const externalWindow = externalWindowRef.current;

		if (!externalWindow) return;

		externalWindow.document.documentElement.dir = direction;
		externalWindow.document.documentElement.lang = locale || 'en';
	}, [ direction, locale ]);

	useEffect(() => {
		titleEl.innerText = title;
	}, [ title, titleEl ]);

	return isOpened ? createPortal(<CacheProvider value={cache}>{ children }</CacheProvider>, containerEl) : null;
};

export default SeparateWindow;
