import { styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import { useAppSelector } from '../../store/hooks';
import { noFilesLabel } from '../translated/translatedComponents';
import ListFile from './ListFile';
import { filesSelector } from '../../store/selectors';
import { FilesharingFile } from '../../utils/types';

const ListUl = styled('ul')({
	listStyleType: 'none',
	paddingLeft: 0,
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
});

const ListItemLi = styled('li')(({ theme }) => ({
	cursor: 'pointer',
	padding: theme.spacing(1),
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
}));

const FilesharingList = (): React.JSX.Element => {
	const files = useAppSelector(filesSelector);
	const meId = useAppSelector((state) => state.me.id);

	return (
		files.length > 0 ?
			<ListUl>
				<Flipper flipKey={files}>
					{ files.map((file: FilesharingFile) => (
						<Flipped key={file.magnetURI} flipId={file.magnetURI}>
							<ListItemLi key={file.magnetURI}>
								<ListFile file={file} isMe={file.peerId === meId} />
							</ListItemLi>
						</Flipped>
					)) }
				</Flipper>
			</ListUl>
			:
			<ListUl>
				<ListItemLi>
					{ noFilesLabel() }
				</ListItemLi>
			</ListUl>
	);
};

export default FilesharingList;
