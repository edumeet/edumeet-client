// Add this decorator to any method, it will skip
// the method if the instance is closed.
export const skipIfClosed = (
	target: unknown,
	propertyKey: string,
	descriptor: PropertyDescriptor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
	const originalValue = descriptor.value;

	descriptor.value = function(...args: unknown[]) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((this as any)?.closed) return;

		return originalValue.apply(this, args);
	};
};