import { CacheProvider } from '@emotion/react';
import createCache, { type EmotionCache } from '@emotion/cache';
import {
	PropsWithChildren,
	ReactNode,
	ReactPortal,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@mui/material/styles';
import { useAppSelector, useConstant } from '../../store/hooks';
import edumeetConfig from '../../utils/edumeetConfig';
import { rtlStylisPlugins } from '../../utils/rtl';

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

	const rtl = useTheme().direction === 'rtl';
	const locale = useAppSelector((state) => state.settings.locale);
	const ltrCache = useConstant(() =>
		createCache({ key: 'external', container: containerEl })
	);
	// Kept once made, so switching back and forth does not insert every style again.
	const rtlCacheRef = useRef<EmotionCache | undefined>(undefined);

	if (rtl && !rtlCacheRef.current)
		rtlCacheRef.current = createCache({ key: 'external-rtl', container: containerEl, stylisPlugins: rtlStylisPlugins() });

	const cache = (rtl && rtlCacheRef.current) || ltrCache;

	const [ isOpened, setOpened ] = useState(false);
	const externalWindow = useRef<Window | null>(null);

	useEffect(() => {
		const opened = window.open(
			'',
			'',
			`width=800,height=${800 / (aspectRatio)},left=200,top=200,scrollbars=on,resizable=on,dependent=on,menubar=off,toolbar=off,location=off`
		);

		// if window.open fails
		if (!opened) {
			onClose?.();

			return;
		}

		setTimeout(() => opened.addEventListener('beforeunload', () => onClose?.()), 0);

		opened.document.body.style.margin = '0';
		opened.document.head.appendChild(titleEl);
		opened.document.body.appendChild(containerEl);
		externalWindow.current = opened;

		setOpened(true);

		return () => {
			externalWindow.current = null;
			opened.close();
		};
	}, []);

	useEffect(() => {
		const root = externalWindow.current?.document.documentElement;

		if (!root) return;

		if (rtl) root.setAttribute('dir', 'rtl');
		else root.removeAttribute('dir');

		root.lang = document.documentElement.lang;
	}, [ rtl, locale, isOpened ]);

	useEffect(() => {
		titleEl.innerText = title;
	}, [ title, titleEl ]);

	return isOpened ? createPortal(<CacheProvider value={cache}>{ children }</CacheProvider>, containerEl) : null;
};

export default SeparateWindow;