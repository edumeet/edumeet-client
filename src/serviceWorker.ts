/* eslint-disable no-unused-vars */
const isLocalhost = Boolean(
	window.location.hostname === 'localhost' ||
		window.location.hostname === '[::1]' ||
		window.location.hostname.match(
			/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
		)
);

type Config = {
	onSuccess?: (registration: ServiceWorkerRegistration) => void;
	onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config): void {
	if (import.meta.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
		const publicUrl = new URL(import.meta.env.PUBLIC_URL, window.location.href);

		if (publicUrl.origin !== window.location.origin)
			return;

		window.addEventListener('load', () => {
			const swUrl = `${import.meta.env.PUBLIC_URL}/service-worker.js`;

			if (isLocalhost) {
				checkValidServiceWorker(swUrl, config);

				navigator.serviceWorker.ready.then();
			} else {
				registerValidSW(swUrl, config);
			}
		});
	}
}

function registerValidSW(swUrl: string, config?: Config) {
	navigator.serviceWorker
		.register(swUrl)
		.then((registration) => {
			registration.onupdatefound = () => {
				const installingWorker = registration.installing;

				if (installingWorker == null)
					return;

				installingWorker.onstatechange = () => {
					if (installingWorker.state === 'installed') {
						if (navigator.serviceWorker.controller) {
							if (config && config.onUpdate) {
								config.onUpdate(registration);
							}
						} else if (config && config.onSuccess) {
							config.onSuccess(registration);
						}
					}
				};
			};
		})
		.catch();
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
	fetch(swUrl, {
		headers: { 'Service-Worker': 'script' },
	})
		.then((response) => {
			const contentType = response.headers.get('content-type');

			if (
				response.status === 404 ||
				(contentType != null && contentType.indexOf('javascript') === -1)
			) {
				navigator.serviceWorker.ready.then((registration) => {
					registration.unregister().then(() => {
						window.location.reload();
					});
				});
			} else {
				registerValidSW(swUrl, config);
			}
		})
		.catch();
}

export function unregister(): void {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready
			.then((registration) => {
				registration.unregister();
			})
			.catch();
	}
}
