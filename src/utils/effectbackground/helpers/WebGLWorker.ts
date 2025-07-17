const workerScript = `
    const timeoutIds = new Map()

    onmessage = (message) => {
        const { timeout, callbackId } = message.data
        const timeoutId = self.setTimeout(() => {
            self.postMessage({ callbackId })
            timeoutIds.delete(callbackId)
        }, timeout)
        timeoutIds.set(callbackId, timeoutId)
    }
`;

export type CallbackFn = () => void

export class WebGLWorker {
	#worker;
	#currentCallbackId;
	#callbacks = new Map<number, CallbackFn>(); 

	constructor() {
		this.#currentCallbackId = 1;
		this.#worker = new Worker(
			URL.createObjectURL(new Blob([ workerScript ], { type: 'application/javascript' })),
			{ name: 'BlurBackgroundWebGL' });
		this.#addListeners();
	}

	public close() {
		this.#worker.terminate();
	}

	#addListeners() {
		this.#worker.onmessage = (message) => {
			const cb = this.#callbacks.get(message.data.callbackId);

			if (!cb) return;
			this.#callbacks.delete(message.data.callbackId);
			cb();
		};
	}
	
	setTimeout(cb: CallbackFn, timeout: number) {
		this.#worker.postMessage({ callbackId: this.#currentCallbackId, timeout });
		this.#callbacks.set(this.#currentCallbackId, cb);
		this.#currentCallbackId++;
	}
}