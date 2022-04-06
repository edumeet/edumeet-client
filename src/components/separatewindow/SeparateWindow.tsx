import {
	ReactNode,
	ReactPortal,
	useEffect,
	useRef,
	useState
} from 'react';
import { createPortal } from 'react-dom';
import edumeetConfig from '../../utils/edumeetConfig';

const copyStyles = (src: Document, dest: Document) => {
	Array.from(src.styleSheets).forEach((styleSheet) =>
		styleSheet?.ownerNode && 
			dest.head.appendChild(
				styleSheet.ownerNode.cloneNode(true)
			)
	);

	Array.from(src.fonts).forEach((font) => dest.fonts.add(font));
};

interface SeparateWindowProps {
	onClose?: () => void;
	aspectRatio?: number;
	children?: ReactNode;
}

const SeparateWindow = ({
	onClose,
	aspectRatio,
	children
}: SeparateWindowProps): ReactPortal | null => {
	const [ container, setContainer ] = useState<HTMLDivElement>();
	const newWindow = useRef<Window | null>();

	useEffect(() => {
		setContainer(document.createElement('div'));
	}, []);

	useEffect(() => {
		if (container) {
			newWindow.current = window.open(
				'',
				edumeetConfig.title,
				`width=800,height=${800 / (aspectRatio || 1.3333)},left=200,top=200`
			);

			if (newWindow.current)
				copyStyles(window.document, newWindow.current.document);

			newWindow.current?.document.body.appendChild(container);
			newWindow.current?.addEventListener('beforeunload', () => onClose && onClose());

			return () => newWindow.current?.close();
		}
	}, [ container ]);

	return container ? createPortal(children, container) : null;
};

export default SeparateWindow;