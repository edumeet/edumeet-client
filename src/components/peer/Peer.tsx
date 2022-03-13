interface PeerProps {
	key: string;
	id: string;
	advancedMode?: boolean;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Peer = ({
	key,
	id,
	advancedMode,
	spacing,
	style
}: PeerProps): JSX.Element => {
	return (<div />);
};

export default Peer;