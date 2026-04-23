import { useEffect, useState } from 'react';
import EventIcon from '@mui/icons-material/Event';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getData } from '../../store/actions/managementActions';
import edumeetConfig from '../../utils/edumeetConfig';
import MeetingsDialog from '../meetingsdialog/MeetingsDialog';
import { upcomingMeetingsLabel } from '../translated/translatedComponents';

const MeetingsButton = ({
	...props
}: ControlButtonProps): React.JSX.Element | null => {
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const myMeetingsTabEnabled = edumeetConfig.myMeetingsTabEnabled;

	const [ invitesEnabled, setInvitesEnabled ] = useState(false);
	const [ open, setOpen ] = useState(false);

	useEffect(() => {
		// always hide until the current async check confirms invites are on
		setInvitesEnabled(false);
		if (!loggedIn || !myMeetingsTabEnabled) return;

		let cancelled = false;

		dispatch(getData('tenantInviteConfigs'))
			.then((res: unknown) => {
				if (cancelled) return;
				const list = (res && typeof res === 'object' && 'data' in res)
					? (res as { data: Array<{ enabled?: boolean }> }).data
					: [];
				const hasEnabled = Array.isArray(list) && list.some((c) => c.enabled);

				setInvitesEnabled(Boolean(hasEnabled));
			})
			.catch(() => {
				if (!cancelled) setInvitesEnabled(false);
			});

		return () => {
			cancelled = true;
		};
	}, [ loggedIn, myMeetingsTabEnabled ]);

	if (!loggedIn || !myMeetingsTabEnabled || !invitesEnabled) return null;

	return (
		<>
			<ControlButton
				toolTip={upcomingMeetingsLabel()}
				onClick={() => setOpen(true)}
				{ ...props }
			>
				<EventIcon />
			</ControlButton>
			<MeetingsDialog open={open} onClose={() => setOpen(false)} />
		</>
	);
};

export default MeetingsButton;
