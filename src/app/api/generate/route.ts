import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export async function POST(req: Request) {
	try {
		const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

		if (!globalRateLimiter.check(ip)) {
			return NextResponse.json(
				{ error: "Too many requests. Please slow down." },
				{ status: 429 },
			);
		}

		const body = await req.json();
		const { prompt, model = "llama3" } = body;

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 },
			);
		}

		// Call local Ollama API
		const response = await fetch("http://127.0.0.1:11434/api/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: model,
				prompt: `You are a creative bedtime storyteller. Tell a short, engaging story about: ${prompt}`,
				stream: true,
			}),
		});

		if (!response.ok || !response.body) {
			throw new Error("Failed to connect to local Ollama instance.");
		}

		// Setup streaming response
		const stream = new TransformStream();
		const writer = stream.writable.getWriter();

		// Process the stream asynchronously
		(async () => {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			const encoder = new TextEncoder();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n").filter(Boolean);

					for (const line of lines) {
						try {
							const data = JSON.parse(line);
							if (data.response) {
								await writer.write(encoder.encode(data.response));
							}
						} catch (e) {
							console.error("Failed to parse Ollama chunk", e);
						}
					}
				}
			} catch (error) {
				console.error("Stream reading error:", error);
			} finally {
				await writer.close();
			}
		})();

		// Return the stream directly as a Response
		return new Response(stream.readable, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
			},
		});
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error or Ollama not running." },
			{ status: 500 },
		);
	}
}
