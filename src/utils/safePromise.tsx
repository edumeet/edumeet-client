export async function safePromise<T>(promise: Promise<T>): Promise<[ null, T ] | [ Error, null ]> {
	try {
		const data = await promise;
		
		return [ null, data ];
	} catch (error) {
		return [ error as Error, null ];
	}
}
