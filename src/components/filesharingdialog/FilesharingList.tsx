import { styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { FilesharingFile } from '../../store/slices/filesharingSlice';
import { permissions } from '../../utils/roles';
import {
	ModeratorActionsMessage,
} from '../translated/translatedComponents';
import ListFile from './ListFile';

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

const ListHeaderLi = styled('li')({
	fontWeight: 'bolder'
});

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const FilesharingList = (): JSX.Element => {
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const files = useAppSelector((state) => state.filesharing);
	const meId = useAppSelector((state) => state.me.id);

	return (
		<FilesharingListDiv>
			{ files.length > 0 ?
				<>
					{ isModerator &&
						<ListUl>
							<ListHeaderLi>
								<ModeratorActionsMessage />
							</ListHeaderLi>
							{ /* <ListModerator /> */ }
						</ListUl>
					}
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
				<ListUl>No files</ListUl>
			}
			
		</FilesharingListDiv>
	);
};

export default FilesharingList;