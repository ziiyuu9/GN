/// <reference types="vitest" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
	let limiter: RateLimiter;

	beforeEach(() => {
		limiter = new RateLimiter(3, 2000);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows requests below the limit", () => {
		expect(limiter.check("127.0.0.1")).toBe(true);
		expect(limiter.check("127.0.0.1")).toBe(true);
		expect(limiter.check("127.0.0.1")).toBe(true);
	});

	it("blocks requests when the limit is exceeded", () => {
		limiter.check("127.0.0.1");
		limiter.check("127.0.0.1");
		limiter.check("127.0.0.1");

		expect(limiter.check("127.0.0.1")).toBe(false);
	});

	it("resets counts after the window time passes", () => {
		limiter.check("127.0.0.1");
		limiter.check("127.0.0.1");
		vi.advanceTimersByTime(2001);
		expect(limiter.check("127.0.0.1")).toBe(true);
	});
});
