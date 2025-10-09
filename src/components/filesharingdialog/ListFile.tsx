import { Button, ButtonGroup, LinearProgress, styled, Typography } from '@mui/material';
import { saveAs } from 'file-saver';
import { useContext, useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import { ServiceContext } from '../../store/store';
import {
	deleteLabel,
	downloadFileLabel,
	meLabel,
	saveFileErrorLabel,
	saveFileLabel,
} from '../translated/translatedComponents';
import { FilesharingFile } from '../../utils/types';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';
import { LocalTorrentFile, LocalWebTorrent } from '../../services/fileService';
import { clearFile } from '../../store/actions/filesharingActions';

interface ListFilerProps {
	file: FilesharingFile;
	isMe: boolean;
}

const FileDiv = styled('div')({
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
});

const FileInfoDiv = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
});

const ListFile = ({
	file,
	isMe,
}: ListFilerProps): JSX.Element => {
	const { fileService } = useContext(ServiceContext);
	const dispatch = useAppDispatch();
	const [ torrent, setTorrent ] = useState<LocalWebTorrent | undefined>();
	const [ done, setDone ] = useState<boolean>(false);
	const [ progress, setProgress ] = useState<number>(0);
	const [ startInProgress, setStartInProgress ] = useState<boolean>(false);

	useEffect(() => {
		if (file.started || isMe) {
			(async () => {
				if (!torrent) {
					const torrentFile = await fileService.getTorrent(file.magnetURI) as LocalWebTorrent;

					if (torrentFile) {
						setTorrent(torrentFile);
						setDone(isMe || Boolean(torrentFile?.done));
						setProgress(torrentFile?.progress || 0);
					}
				}
			})();
		}
	}, []);

	useEffect(() => {
		if (torrent) {
			torrent.on('download', () => {
				setProgress(torrent.downloaded / torrent.length || 0);
				if (torrent.downloaded === torrent.length)
					setDone(true);
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
		dispatch(roomSessionsActions.updateFile({ ...file, started: true }));
		const newTorrent = await fileService.downloadFile(file.magnetURI);

		setTorrent(newTorrent);
		setStartInProgress(false);
	};

	const saveSubFile = async (saveFile: LocalTorrentFile): Promise<void> => {
		try {
			saveAs(await saveFile.blob(), saveFile.name);
		} catch (error) {
			dispatch(notificationsActions.enqueueNotification({
				message: saveFileErrorLabel(),
				options: { variant: 'error' }
			}));
		}
	};

	const handleClearFile = (): void => {
		const magnetURI = file.magnetURI;

		dispatch(clearFile(magnetURI));
	};

	const handleClearFileLocaly = (): void => {
		const magnetURI = file.magnetURI;

		fileService.removeFile(magnetURI);
		setDone(false);
		setProgress(0);
		dispatch(roomSessionsActions.updateFile({ ...file, started: false }));
	};

	return (
		<FileDiv>
			{ file?.started || isMe ?
				torrent?.files?.map((subFile, index) => (
					<FileDiv key={index}>
						<FileInfoDiv>
							<Typography noWrap={false}
								sx={{
									whiteSpace: 'normal', // allow breaking
									overflowWrap: 'break-word', // break long words
									wordBreak: 'break-word', // fallback
									lineHeight: 1.2,
								}}>({ isMe ? meLabel() : file.displayName }) { subFile.name }</Typography>
							<ButtonGroup variant="contained" aria-label="Basic button group">
								{ done && isMe &&
								<Button
									aria-label={deleteLabel()}
									variant='contained'
									color='error'
									onClick={handleClearFile}
									size='small'
								>
									{ deleteLabel() }
								</Button>
								}
								{ done && !isMe &&
								<Button
									aria-label={saveFileLabel()}
									variant='contained'
									onClick={() => saveSubFile(subFile as LocalTorrentFile)}
									size='small'
								>
									{ saveFileLabel() }
								</Button>
								}
								{ done && !isMe &&
								<Button
									aria-label={deleteLabel()}
									variant='contained'
									color='warning'
									onClick={handleClearFileLocaly}
									size='small'
								>
									{ deleteLabel() }
								</Button>
								}
							</ButtonGroup>
						</FileInfoDiv>
					</FileDiv>
				))
				:
				<FileInfoDiv>
					<Typography noWrap={false}
						sx={{
							whiteSpace: 'normal', // allow breaking
							overflowWrap: 'break-word', // break long words
							wordBreak: 'break-word', // fallback
							lineHeight: 1.2,
						}}>
						{ file.displayName }: { new URLSearchParams(file.magnetURI.slice(8)).get('dn') }
					</Typography>

					{ !file.started &&
						<ButtonGroup variant="contained" aria-label="Basic button group">
							<Button
								aria-label={downloadFileLabel()}
								variant='contained'
								onClick={startTorrent}
								disabled={startInProgress}
								size='small'
							>
								{ downloadFileLabel() }
							</Button>
						</ButtonGroup>
					}
				</FileInfoDiv>
			}
			{ file.started && !done &&
				<>
					<LinearProgress
						variant='determinate'
						value={progress * 100} />
					<div>{ Math.round(progress * 100) }%</div>
					<Button
						aria-label={deleteLabel()}
						variant='contained'
						onClick={handleClearFileLocaly}
						size='small'
					>
						{ deleteLabel() }
					</Button>
				</>
			}
		</FileDiv>
	);
};

export default ListFile;
