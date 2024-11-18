/**
 * Call the provided asynchronous function and throw an error if it takes longer than the time limit
 * 
 * @param {Promise<T>} promise Promise to resolve
 * @param {number} timeout Time in milliseconds
 * @returns {Promise<T>} Wrapped promise that will throw an error if it takes longer than the time limit
 */
export const timeoutPromise = async <T>(
	promise: Promise<T>,
	timeout: number
): Promise<T> => {
	let timeoutHandle: NodeJS.Timeout | undefined;

	const _timeoutPromise = new Promise<T>((_, reject) => (timeoutHandle = setTimeout(() => reject(new Error('Promise timed out')), timeout)));

	return Promise.race([ promise, _timeoutPromise ]).then((result) => {
		clearTimeout(timeoutHandle);

		return result;
	});
};
