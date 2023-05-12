import { styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
} from '../../store/hooks';
import { noFilesLabel } from '../translated/translatedComponents';
import ListFile from './ListFile';
import { filesSelector } from '../../store/selectors';
import { FilesharingFile } from '../../utils/types';

const FilesharingListDiv = styled('div')(({ theme }) => ({
	width: '100%',
	overflowY: 'auto',
	padding: theme.spacing(1)
}));

const ListUl = styled('ul')(({ theme }) => ({
	listStyleType: 'none',
	padding: theme.spacing(1),
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
	backgroundColor: 'rgba(255, 255, 255, 1)'
}));

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const FilesharingList = (): JSX.Element => {
	const files = useAppSelector(filesSelector);
	const meId = useAppSelector((state) => state.me.id);

	return (
		<FilesharingListDiv>
			{ files.length > 0 ?
				<>
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
				</>
				:
				<ListUl>{ noFilesLabel() }</ListUl>
			}
			
		</FilesharingListDiv>
	);
};

export default FilesharingList;