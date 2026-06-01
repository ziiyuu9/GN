import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: Request) {
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"127.0.0.1";
	if (!globalRateLimiter.check(ip)) {
		return NextResponse.json(
			{ error: "請稍候再試，語音請求速度已達上限。" },
			{ status: 429, headers: corsHeaders },
		);
	}

	try {
		const formData = await request.formData();
		const audioBlob = formData.get("audio") as Blob | null;
		const storyText = formData.get("story") as string | null;

		if (!audioBlob || !storyText) {
			return NextResponse.json(
				{ error: "Audio file and story text are required" },
				{ status: 400, headers: corsHeaders },
			);
		}

		const ttsBaseUrl =
			process.env.LOCAL_TTS_BASE_URL || "http://localhost:8000";
		const ttsApiPath = process.env.LOCAL_TTS_API_PATH || "/v1/tts";

		try {
			const audioBuffer = await audioBlob.arrayBuffer();
			const audioBase64 = Buffer.from(audioBuffer).toString("base64");
			const ttsBody = {
				text: storyText,
				references: [
					{
						text: "reference voice sample",
						audio: audioBase64,
					},
				],
				format: "wav",
			};

			const ttsResponse = await fetch(`${ttsBaseUrl}${ttsApiPath}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(ttsBody),
				signal: AbortSignal.timeout(30000),
			});

			if (!ttsResponse.ok) {
				throw new Error(
					`Local TTS server failed to process request: ${ttsResponse.status}`,
				);
			}

			const audioBufferOut = await ttsResponse.arrayBuffer();
			const audioBase64Out = Buffer.from(audioBufferOut).toString("base64");

			return NextResponse.json(
				{ audioBase64: audioBase64Out },
				{
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				}
			);
		} catch (error) {
			console.warn("⚠️ Local TTS server is not reachable.", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			return NextResponse.json(
				{
					audioBase64: null,
					message: "本地語音服務無法連線，請啟動本地 TTS 服務。",
				},
				{
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				}
			);
		}
	} catch (error) {
		console.error("Error in clone-voice route:", error);
		return NextResponse.json(
			{ error: "Failed to process voice" },
			{
				status: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
				},
			}
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
