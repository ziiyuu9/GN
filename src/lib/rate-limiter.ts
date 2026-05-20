export class RateLimiter {
	private requests: Map<string, number[]> = new Map();
	private readonly limit: number;
	private readonly windowMs: number;

	constructor(limit: number, windowMs: number) {
		this.limit = limit;
		this.windowMs = windowMs;
	}

	check(ip: string): boolean {
		const now = Date.now();
		const timestamps = this.requests.get(ip) || [];

		// Filter out timestamps older than the window
		const validTimestamps = timestamps.filter(
			(time) => now - time < this.windowMs,
		);

		if (validTimestamps.length >= this.limit) {
			return false; // Rate limit exceeded
		}

		validTimestamps.push(now);
		this.requests.set(ip, validTimestamps);
		return true;
	}
}

// Global instance for high concurrency (e.g., 5 requests per 10 seconds per IP)
export const globalRateLimiter = new RateLimiter(5, 10000);
