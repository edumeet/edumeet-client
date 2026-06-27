import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ClientIssue, ClientMonitorIssueType, RaisedClientIssue } from '@observertc/client-monitor-js';
import { SignalCellularAlt } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { ServiceContext } from '../../store/store';
import Stats from './Stats';

const issueType: ClientMonitorIssueType = 'congestion';

const QualityIndicator = (): React.JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ congested, setCongested ] = useState<boolean>(false);

	useEffect(() => {
		const monitor = mediaService.monitor;

		if (!monitor) return;

		setCongested(
			monitor.activeIssues.has(issueType)
		);

		const onIssue = (issue: ClientIssue) => {
			if (issueType !== issue.type) return;

			setCongested(true);
		};

		const onResolvedIssue = (issue: RaisedClientIssue) => {
			if (issueType !== issue.type) return;

			setCongested(false);
		};

		monitor.on('issue', onIssue);
		monitor.on('issue-resolved', onResolvedIssue);

		return () => {
			monitor.off('issue', onIssue);
			monitor.off('issue-resolved', onResolvedIssue);
		};
	}, [ mediaService.monitor ]);

	if (!congested) return <></>;

	return (
		<Stats orientation='vertical' horizontalPlacement='right' verticalPlacement='top'>
			<Tooltip title='Network congestion detected' placement='left'>
				<SignalCellularAlt style={{ color: '#f44336' }} />
			</Tooltip>
		</Stats>
	);
};

export default QualityIndicator;
