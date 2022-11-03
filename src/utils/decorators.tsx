/**
 * Decorator to add to a class method to skip the method if
 * the class instance has a closed value of true.
 * 
 * @param {unknown} target - The class instance
 * @param {string} propertyKey - The name of the method
 * @param {PropertyDescriptor} descriptor - The descriptor of the method
 * @returns {any} The result of the method if the class instance is not closed.
 */
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