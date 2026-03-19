import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box, Link, Typography, MenuItem, Select, InputLabel, FormControl, Tab, Tabs } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { enterRoomLabel, myRoomsLabel, copyRoomLabel, copiedRoomLabel, joinLabel, roomNameLabel, imprintLabel, joinConsentLabel, privacyPolicyLabel } from '../../components/translated/translatedComponents';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { QRCode } from 'react-qrcode-logo';
import edumeetConfig from '../../utils/edumeetConfig';
import { startListeners, stopListeners } from '../../store/actions/startActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getData } from '../../store/actions/managementActions';
import { Room } from '../../utils/types';

const LandingPage = (): React.JSX.Element | null => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ activeEntryTab, setActiveEntryTab ] = useState(0);
	const [ copyFeedback, setCopyFeedback ] = useState(false);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const qrCodeEnabled = edumeetConfig.qrCodeEnabled;
	const myRoomsTabEnabled = edumeetConfig.myRoomsTabEnabled;

	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const roomUrl = `${window.location.protocol}//${window.location.hostname}/${roomId}`;

	const onClicked = () => navigate(`/${roomId}`);

	const handleRoomSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
		const selectedValue = event.target.value as string;

		setRoomId(selectedValue);
	};

	const handleTabChange = (_event: React.ChangeEvent<unknown>, value: number) => {
		if (value === 1 && myRoomsTabEnabled && loggedIn && rooms.length > 0) {
			const isRoomInList = rooms.some((room) => (room.name ?? '') === roomId);

			if (!isRoomInList && roomId.trim() !== '') {
				setRoomId('');
			}
		}

		if (value === 0 && randomizeOnBlank && roomId === '') {
			setRoomId(randomString({ length: 8 }).toLowerCase());
		}

		setActiveEntryTab(value);
	};

	const handleDropdownOpen = () => {
		dispatch(getData('rooms')).then((roomsData: unknown) => {
			if (roomsData && typeof roomsData === 'object' && 'data' in roomsData) {
				setRooms(roomsData.data as Room[]);
			}
		});
	};

	const handleCopyClick = () => {
		navigator.clipboard.writeText(roomUrl).then(() => {
			setCopyFeedback(true);
			setTimeout(() => setCopyFeedback(false), 2000);
		});
	};

	useEffect(() => {
		if (!myRoomsTabEnabled) return;

		if (loggedIn && !randomizeOnBlank && rooms.length > 0) {
			setActiveEntryTab(1);
		}

		if (!loggedIn || rooms.length === 0) {
			setActiveEntryTab(0);
		}
	}, [ loggedIn, rooms ]);

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
		};
	}, [ dispatch ]);

	useEffect(() => {
		if (!myRoomsTabEnabled || !loggedIn) return;

		dispatch(getData('rooms')).then((roomsData: unknown) => {
			if (roomsData && typeof roomsData === 'object' && 'data' in roomsData) {
				setRooms(roomsData.data as Room[]);
			}
		});
	}, [ loggedIn ]);

	useEffect(() => {
		if (!myRoomsTabEnabled || !loggedIn) return;

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				dispatch(getData('rooms')).then((roomsData: unknown) => {
					if (roomsData && typeof roomsData === 'object' && 'data' in roomsData) {
						setRooms(roomsData.data as Room[]);
					}
				});
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [ loggedIn, dispatch ]);

	if (localeInProgress) {
		return null;
	}

	return (
		<StyledBackground>
			<GenericDialog
				showFooter={true}
				precallTitleBackground={true}
				title={ <PrecallTitle /> }
				content={
					<Container style={{ textAlign: 'center' }}>
						{myRoomsTabEnabled && loggedIn && rooms.length > 0 && (
							<Tabs
								value={activeEntryTab}
								onChange={handleTabChange}
								centered
							>
								<Tab label={enterRoomLabel()} aria-label={enterRoomLabel()} />
								<Tab label={myRoomsLabel()} aria-label={myRoomsLabel()} />
							</Tabs>
						)}
						<Box sx={{ minHeight: 80 }}>
							{activeEntryTab === 0 && (
								<Box sx={{ pt: 2 }}>
									<TextInputField
										label={roomNameLabel()}
										value={roomId}
										setValue={setRoomId}
										onEnter={onClicked}
										randomizeOnBlank={randomizeOnBlank}
										autoFocus
									/>
								</Box>
							)}
							{activeEntryTab === 1 && myRoomsTabEnabled && loggedIn && rooms.length > 0 && (
								<FormControl fullWidth margin="normal">
									<InputLabel id="room-select-label">{roomNameLabel()}</InputLabel>
									<Select
										labelId="room-select-label"
										id="room-select"
										value={roomId}
										label={roomNameLabel()}
										onChange={(event) => { handleRoomSelect(event as React.ChangeEvent<{ value: unknown }>); }}
										onOpen={handleDropdownOpen}
										autoFocus
										style={{ textAlign: 'left' }}
									>
										{rooms.map((room) => (
											<MenuItem key={room.id} value={room.name ?? ''}>{room.name ?? ''}</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						</Box>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 1 }}>
							<Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
								{roomUrl}
							</Typography>
							<Button
								size='small'
								variant='text'
								onClick={handleCopyClick}
								disabled={!roomId.trim()}
							>
								{copyFeedback ? copiedRoomLabel() : copyRoomLabel()}
							</Button>
						</Box>
						{qrCodeEnabled && (
							<Box sx={{ visibility: roomId.trim() ? 'visible' : 'hidden' }}>
								<QRCode value={roomUrl} size={150} />
							</Box>
						)}
					</Container>
				}
				actions={
					<Box display="flex" alignItems="flex-end" justifyContent="space-between" width="100%">
						<Box display="flex" alignItems="left">
							{imprintUrl.trim() !== '' && (
								<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
									<Typography variant="caption" color="text.secondary">{ imprintLabel() }</Typography>
								</Link>
							)}
						</Box>
						<Box display="flex" flexDirection="column" alignItems="flex-end">
							{privacyUrl.trim() !== '' && (
								<Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
									{joinConsentLabel()}{' '}
									<Link href={privacyUrl} target="_blank" color="inherit">
										{privacyPolicyLabel()}
									</Link>
								</Typography>
							)}
							<Button
								onClick={onClicked}
								variant='contained'
								disabled={!roomId}
								size='small'
							>
								{ joinLabel()}
							</Button>
						</Box>
					</Box>
				}
			/>

		</StyledBackground>
	);
};

export default LandingPage;
