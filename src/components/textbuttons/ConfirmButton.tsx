import { Button, ButtonProps } from '@mui/material';
import { ReactNode, useState } from 'react';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	noLabel,
	yesLabel
} from '../translated/translatedComponents';

interface ConfirmButtonProps extends Pick<ButtonProps, 'size' | 'color' | 'variant'> {
	label: string;
	confirmContent: ReactNode;
	confirmTitle?: string;
	disabled?: boolean;
	onConfirm: () => void;
}

const ConfirmButton = ({
	label,
	confirmContent,
	confirmTitle,
	disabled,
	onConfirm,
	size,
	color = 'error',
	variant = 'contained',
}: ConfirmButtonProps): React.JSX.Element => {
	const [ confirmOpen, setConfirmOpen ] = useState(false);

	const handleCloseConfirm = (): void => setConfirmOpen(false);

	const handleConfirm = (): void => {
		setConfirmOpen(false);
		onConfirm();
	};

	return (
		<>
			<Button
				aria-label={label}
				color={color}
				variant={variant}
				onClick={() => setConfirmOpen(true)}
				disabled={disabled}
				size={size}
			>
				{ label }
			</Button>

			<GenericDialog
				open={confirmOpen}
				onClose={handleCloseConfirm}
				title={confirmTitle ?? label}
				content={confirmContent}
				actions={
					<>
						<Button onClick={handleCloseConfirm} disabled={disabled} variant='outlined'>
							{ noLabel() }
						</Button>
						<Button
							color={color}
							variant='contained'
							onClick={handleConfirm}
							disabled={disabled}
						>
							{ yesLabel() }
						</Button>
					</>
				}
			/>
		</>
	);
};

export default ConfirmButton;
