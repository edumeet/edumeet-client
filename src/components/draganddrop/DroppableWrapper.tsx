import React from 'react';
import { useDroppable } from '@dnd-kit/core';

type DroppableElementProps = {
	children: React.ReactNode;
	id: string;
  };
  
const DroppableWrapper = ({ children, id }: DroppableElementProps): React.JSX.Element => {
	const { setNodeRef } = useDroppable({
		id: id,
	});
  
	return (
		<div 
			ref={setNodeRef} 
		>
			{children}
		</div>
	);
};

export default DroppableWrapper;