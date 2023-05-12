/**
 * AnomalyDetector is a simple statistical anomaly detection class
 * that uses a moving average and standard deviation to detect anomalies
 * in continuous measurements.
 *
 * The detector maintains a sliding window of the specified size and calculates
 * the mean and standard deviation within the window. A measurement is considered
 * an anomaly if its deviation from the mean is greater than a specified threshold
 * times the standard deviation and higher than the minDeviationThreshold.
 *
 * For example to detect an anomaly for incoming RTT measurements in seconds,
 * only if the deviation is larger than 50ms, we define it as follows:
 * ```javascript
 * Usage:
 * const windowSize = 30;
 * const stdMultiplierThreshold = 3;
 * const minDeviationThreshold = 0.05;
 * const detector = new AnomalyDetector(windowSize, threshold);
 *
 * const measurements = [ Your continuous measurements go here ];
 *
 * measurements.forEach((measurement) => {
 *   if (detector.isAnomaly(measurement)) {
 *     console.log(`Anomaly detected: ${measurement}`);
 *   }
 * });
 * ```
 * The anomalyDetector waits for 30 measurements and then if the incoming measurement
 * calculated deviation is higher than 50ms and considered to be anomaly the `isAnomaly` function returns true
 */
export class AnomalyDetector {
	private _windowSize: number;
	private _stdMultiplierThreshold: number;
	private _minDeviationThreshold?: number;
	private _measurements: number[];
	private _sum: number;
	private _sumSquares: number;
	private _badTicks = 0;

	constructor(windowSize: number, stdMultiplierThreshold: number, minDeviationThreshold?: number) {
		this._windowSize = windowSize;
		this._stdMultiplierThreshold = stdMultiplierThreshold;
		this._minDeviationThreshold = minDeviationThreshold;
		this._measurements = [];
		this._sum = 0;
		this._sumSquares = 0;
	}

	private updateSums(value: number): void {
		this._sum += value;
		this._sumSquares += value * value;

		if (this._measurements.length > this._windowSize) {
			const removedValue = this._measurements.shift();

			if (!removedValue) {
				// won't happen
				return;
			}
			this._sum -= removedValue;
			this._sumSquares -= removedValue * removedValue;
		}
	}

	private calculateMean(): number {
		return this._sum / this._measurements.length;
	}

	private calculateStdDev(mean: number): number {
		const variance = (this._sumSquares / this._measurements.length) - (mean * mean);

		return Math.sqrt(variance);
	}

	public isAnomaly(value: number): boolean {
		this._measurements.push(value);

		if (this._measurements.length < this._windowSize) {
			this.updateSums(value);
			return false;
		}
		const mean = this.calculateMean();
		const stdDev = this.calculateStdDev(mean);
		const deviation = Math.abs(value - mean);
		
		if (this._minDeviationThreshold && this._minDeviationThreshold >= deviation) {
			this.updateSums(value);
			return false;
		}
		const result = deviation > this._stdMultiplierThreshold * stdDev;
		if (result) {
			if (this._windowSize / 2 < ++this._badTicks) {
				this.updateSums(value);
			}
		} else {
			this._badTicks = 0;
		}

		return result;
	}
}