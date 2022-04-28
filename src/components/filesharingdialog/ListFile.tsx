import { Button, styled } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import WebTorrent from 'webtorrent';
import { ServiceContext } from '../../store/store';
import { FilesharingFile } from '../../utils/types';

interface ListFilerProps {
	file: FilesharingFile;
}

const FileDiv = styled('div')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex'
});

const FileInfoDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	fontSize: '1rem',
	paddingLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const ListFile = ({
	file
}: ListFilerProps): JSX.Element => {
	const { fileService } = useContext(ServiceContext);

	const [ torrent, setTorrent ] =
		useState<WebTorrent.Torrent | undefined>(fileService.getTorrent(file.magnetURI));
	const [ done, setDone ] = useState(Boolean(torrent?.done));
	const [ progress, setProgress ] = useState(torrent?.progress || 0);

	useEffect(() => {
		if (torrent) {
			torrent.on('download', () => setProgress(torrent.progress || 0));
			torrent.on('done', () => setDone(true));

			return () => {
				if (torrent) {
					torrent.removeAllListeners('download');
					torrent.removeAllListeners('done');
				}
			};
		}
	}, []);

	useEffect(() => {
		if (torrent) {
			torrent.on('download', () => setProgress(torrent.progress || 0));
			torrent.on('done', () => setDone(true));

			return () => {
				if (torrent) {
					torrent.removeAllListeners('download');
					torrent.removeAllListeners('done');
				}
			};
		}
	}, [ torrent ]);

	const startTorrent = async (): Promise<void> => {
		const newTorrent = await fileService.downloadFile(file.magnetURI);

		setTorrent(newTorrent);
	};

	return (
		<FileDiv>
			<FileInfoDiv>
				{ file.magnetURI }
				{ progress > 0 && <span>{ progress }</span> }
				{ done && <span>Done</span> }
				<Button onClick={startTorrent}>
					Start
				</Button>
			</FileInfoDiv>
		</FileDiv>
	);
};

export default ListFile;