import { Button, LinearProgress, styled } from '@mui/material';
import { saveAs } from 'file-saver';
import { useContext, useEffect, useState } from 'react';
import WebTorrent, { TorrentFile } from 'webtorrent';
import { useAppDispatch } from '../../store/hooks';
import { filesharingActions, FilesharingFile } from '../../store/slices/filesharingSlice';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import { ServiceContext } from '../../store/store';
import {
	DownloadFileMessage,
	MeMessage,
	saveFileErrorLabel,
	SaveFileMessage
} from '../translated/translatedComponents';

interface ListFilerProps {
	file: FilesharingFile;
	isMe: boolean;
}

const FileDiv = styled('div')(({ theme }) => ({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
	marginTop: theme.spacing(1),
	marginBottom: theme.spacing(1),
}));

const FileInfoDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'row',
	fontSize: '1rem',
	paddingLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center',
	justifyContent: 'space-between',
}));

const ListFile = ({
	file,
	isMe,
}: ListFilerProps): JSX.Element => {
	const { fileService } = useContext(ServiceContext);
	const dispatch = useAppDispatch();
	const [ torrent, setTorrent ] = useState<WebTorrent.Torrent | undefined>();
	const [ done, setDone ] = useState<boolean>(false);
	const [ progress, setProgress ] = useState<number>(0);
	const [ startInProgress, setStartInProgress ] = useState<boolean>(false);

	useEffect(() => {
		if (file.started || isMe) {
			const torrentFile = fileService.getTorrent(file.magnetURI);

			setTorrent(torrentFile);
			setDone(isMe || Boolean(torrentFile?.done));
			setProgress(torrentFile?.progress || 0);
		}
	}, []);

	useEffect(() => {
		if (torrent) {
			torrent.on('download', () => {
				if (torrent.progress > progress)
					setProgress(torrent.progress || 0);
			});
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
		setStartInProgress(true);

		const newTorrent = await fileService.downloadFile(file.magnetURI);

		setTorrent(newTorrent);
		dispatch(filesharingActions.updateFile({ ...file, started: true }));
		setStartInProgress(false);
	};

	const saveSubFile = (saveFile: TorrentFile): void => {
		saveFile.getBlob((err, blob) => {
			if (err)
				return dispatch(notificationsActions.enqueueNotification({
					message: saveFileErrorLabel(),
					options: { variant: 'error' }
				}));

			if (blob)
				saveAs(blob, saveFile.name);
		});
	};

	return (
		<FileDiv>
			{ file.started || isMe ?
				torrent?.files.map((subFile, index) => (
					<FileDiv key={index}>
						<FileInfoDiv>
							({ isMe ? <MeMessage /> : file.displayName }) { subFile.name }
							{ done && !isMe &&
								<Button
									variant='contained'
									onClick={() => saveSubFile(subFile)}
								>
									<SaveFileMessage />
								</Button>
							}
						</FileInfoDiv>
					</FileDiv>
				))
				:
				<FileInfoDiv>
					{ file.displayName }
					{ !file.started &&
						<Button
							variant='contained'
							onClick={startTorrent}
							disabled={startInProgress}
						>
							<DownloadFileMessage />
						</Button>
					}
				</FileInfoDiv>
			}
			{ file.started && !done &&
				<LinearProgress
					variant='determinate'
					value={progress * 100}
				/>
			}
		</FileDiv>
	);
};

export default ListFile;