import EventEmitter from 'events';
import type { Transport } from 'mediasoup-client/lib/Transport';
import { Logger } from './Logger';

const logger = new Logger('PerformanceMonitor');
const SAMPLE_WINDOW = 8;
const SAMPLE_INTERVAL = 500;

declare global {
	interface Window {
		transport: Transport;
	}
}

interface VideoSample {
	previousTimestamp: number;
	previousTotalDecodeTime: number;
	previousFramesDecoded: number;
	decodeVolatility: number;
	decodeVolatilityPercent: number;
	decodeFrameRates: number[];
}

export interface PerformanceResult {
	trend: 'up' | 'down' | 'stable';
	performance: 'verygood' | 'good' | 'bad' | 'verybad';
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export declare interface PerformanceMonitor {
	// eslint-disable-next-line no-unused-vars
	on(event: 'performance', listener: (performance: PerformanceResult) => void): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class PerformanceMonitor extends EventEmitter {
	private monitorTimeout: ReturnType<typeof setTimeout> | null = null;

	// FPS samples ordered by inbound-rtp ID
	private videoSamples: Record<string, VideoSample> = {};
	// Rolling window of SAMPLE_WINDOW samples
	private timeoutSamples: number[] = [];
	private statsSamples: number[] = [];
	private decodeVolatilitySamples: number[] = [];

	private timeoutStartTime = Date.now();

	public monitorTransport(transport: Transport): void {
		logger.debug('monitorTransport() [id:%s]', transport.id);

		window.transport = transport;

		const performanceMonitor = async (): Promise<void> => {
			const timeoutExecutionTime = Date.now();

			try {
				const statsStartTime = Date.now();
				const stats = await transport.getStats();
				const statsEndTime = Date.now();

				const statsDuration = statsEndTime - statsStartTime;
				const timeoutDuration = timeoutExecutionTime - this.timeoutStartTime;

				this.timeoutSamples.push(timeoutDuration) > SAMPLE_WINDOW &&
					this.timeoutSamples.shift();
				this.statsSamples.push(statsDuration) > SAMPLE_WINDOW &&
					this.statsSamples.shift();

				let decodeVolatilitySum = 0;
				let decodeVolatilityCount = 0;

				stats.forEach((report) => {
					if (
						report.type === 'inbound-rtp' &&
						report.kind === 'video' &&
						report.ssrc !== '1234' // We don't want the prober
					) {
						const timestamp = report.timestamp;
						const framesPerSecond = report.framesPerSecond;
						const framesDecoded = report.framesDecoded;
						const totalDecodeTime = report.totalDecodeTime;

						// Firefox does not report totalDecodeTime/framesPerSecond
						if (!totalDecodeTime || !framesPerSecond)
							return;

						if (framesPerSecond < 10)
							return;

						const sample = this.videoSamples[report.id] || {
							previousTimestamp: 0,
							previousTotalDecodeTime: 0,
							previousFramesDecoded: 0,
							decodeVolatility: 0,
							decodeVolatilityPercent: 0,
							decodeFrameRates: [],
						};

						const deltaFramesDecoded = framesDecoded - sample.previousFramesDecoded;

						// We don't care about the sample if there are no decoded frames
						if (!deltaFramesDecoded)
							return;

						const deltaTotalDecodeTime =
							1000 * (totalDecodeTime - sample.previousTotalDecodeTime);
						let decodeTime = (deltaTotalDecodeTime / deltaFramesDecoded);

						if (decodeTime < 10)
							decodeTime = 10;

						const decodeFrameRate = 1000 / decodeTime;
						// const deltaTime = timestamp - sample.previousTimestamp;
						// const renderFrameRate = deltaFramesDecoded / deltaTime * 1000;

						sample.previousTimestamp = timestamp;
						sample.previousFramesDecoded = framesDecoded;
						sample.previousTotalDecodeTime = totalDecodeTime;
						sample.decodeFrameRates.push(decodeFrameRate) > SAMPLE_WINDOW &&
							sample.decodeFrameRates.shift();

						const meanDecodeFrameRate =
							sample.decodeFrameRates.reduce((acc, val) =>
								acc + val, 0
							) / sample.decodeFrameRates.length;

						const decodeVolatility =
							sample.decodeFrameRates.reduce((acc, val) =>
								acc + Math.abs(val - meanDecodeFrameRate), 0
							) / sample.decodeFrameRates.length;

						/*
						const decodeVolatilityPercent = decodeVolatility / meanDecodeFrameRate * 100;

						logger.debug(
							'monitorTransport() [
								framesPerSecond:%s, renderFrameRate:%s,
								decodeFrameRate:%s, meanDecodeFrameRate:%s,
								decodeVolatility:%s, decodeVolatilityPercent:%s
							]',
							framesPerSecond,
							renderFrameRate,
							decodeFrameRate,
							meanDecodeFrameRate,
							decodeVolatility,
							decodeVolatilityPercent
						);
						*/

						decodeVolatilitySum += decodeVolatility;
						decodeVolatilityCount++;

						this.videoSamples[report.id] = sample;
					}
				});

				if (decodeVolatilityCount) {
					const aggregatedDecodeVolatility = decodeVolatilitySum / decodeVolatilityCount;

					this.decodeVolatilitySamples.push(aggregatedDecodeVolatility) > SAMPLE_WINDOW &&
						this.decodeVolatilitySamples.shift();
				}

				/*
				logger.debug(
					'monitorTransport() [
						timeoutSamples:%o, statsSamples:%o, decodeVolatilitySamples:%o
					]',
					this.timeoutSamples,
					this.statsSamples,
					this.decodeVolatilitySamples,
				);
				*/

				// TODO: emit an actionable performance report
			} catch (error) {
				logger.error('monitorTransport() [id:%s] [error:%o]', transport.id, error);
			}

			this.timeoutStartTime = Date.now();
			this.monitorTimeout = setTimeout(performanceMonitor, SAMPLE_INTERVAL);
		};

		// Start monitoring
		this.timeoutStartTime = Date.now();
		this.monitorTimeout = setTimeout(performanceMonitor, SAMPLE_INTERVAL);

		transport.observer.once('close', () => {
			logger.debug('monitorTransport() transport closed [id:%s]', transport.id);

			if (this.monitorTimeout)
				clearTimeout(this.monitorTimeout);
		});
	}
}
