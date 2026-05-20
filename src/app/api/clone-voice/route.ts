import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export async function POST(request: Request) {
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"127.0.0.1";
	if (!globalRateLimiter.check(ip)) {
		return NextResponse.json(
			{ error: "請稍候再試，語音請求速度已達上限。" },
			{ status: 429 },
		);
	}

	try {
		const formData = await request.formData();
		const audioBlob = formData.get("audio") as Blob | null;
		const storyText = formData.get("story") as string | null;

		if (!audioBlob || !storyText) {
			return NextResponse.json(
				{ error: "Audio file and story text are required" },
				{ status: 400 },
			);
		}

		const ttsBaseUrl =
			process.env.LOCAL_TTS_BASE_URL || "http://localhost:8000";

		try {
			const ttsFormData = new FormData();
			ttsFormData.append("voice_sample", audioBlob, "sample.wav");
			ttsFormData.append("text", storyText);
			ttsFormData.append("language", "zh");

			const ttsResponse = await fetch(
				`${ttsBaseUrl}/api/clone_and_synthesize`,
				{
					method: "POST",
					body: ttsFormData,
					signal: AbortSignal.timeout(4000),
				},
			);

			if (!ttsResponse.ok) {
				throw new Error("Local TTS server failed to process request");
			}

			const audioBuffer = await ttsResponse.arrayBuffer();
			const audioBase64 = Buffer.from(audioBuffer).toString("base64");

			return NextResponse.json({ audioBase64 });
		} catch (error) {
			console.warn("⚠️ [Mock Mode] Local TTS server is not reachable.", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			return NextResponse.json({
				audioBase64: null,
				message: "本地語音服務無法連線，請啟動本地 TTS 服務。",
			});
		}
	} catch (error) {
		console.error("Error in clone-voice route:", error);
		return NextResponse.json(
			{ error: "Failed to process voice" },
			{ status: 500 },
		);
	}
}
