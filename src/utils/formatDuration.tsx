export const formatDuration = (duration: number): string => {
	const durationInSeconds = Math.round(duration / 1000);

	const hours = Math.floor(durationInSeconds / 3600);
	const minutes = Math.floor((durationInSeconds - (hours * 3600)) / 60);
	const seconds = durationInSeconds - (minutes * 60) - (hours * 3600);

	const formattedElements: Array<string> = new Array(3);

	formattedElements[0] = seconds < 10 ? '0'.concat(seconds.toString()) : seconds.toString();
	formattedElements[1] = (minutes < 10 ? 
		'0'.concat(minutes.toString()) : minutes.toString()
	).concat(':');
	formattedElements[2] = hours.toString().concat(':');

	const formattedString = (
		(hours ? formattedElements[2] : '') + formattedElements[1] + formattedElements[0]
	);

	return formattedString;
};