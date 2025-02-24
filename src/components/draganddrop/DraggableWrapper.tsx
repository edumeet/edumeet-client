import React from 'react';
import { useDraggable } from '@dnd-kit/core';

type DraggableElementProps = {
	children: React.ReactNode;
	id: string;
	disabled: boolean;
  };
  
const DraggableWrapper = ({ children, id, disabled }: DraggableElementProps): JSX.Element => {
	const { attributes, listeners, setNodeRef } = useDraggable({
		id: id,
		disabled: disabled
	});
	const style ={
		cursor: disabled ? 'auto' : 'grab'
	};
  
	return (
		<div 
			ref={setNodeRef} 
			{...attributes}
			{...listeners}
			style={style}
		>
			{children}
		</div>
	);
};

export default DraggableWrapper;