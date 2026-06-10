import { Client } from "@gradio/client";
import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export const maxDuration = 60; // 允許較長的 Vercel 執行時間

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const VOICE_CLONE_SPACE =
	process.env.VOICE_CLONE_SPACE || "tonyassi/voice-clone";

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

		console.log(
			`Connecting to Hugging Face Gradio Space (${VOICE_CLONE_SPACE})...`,
		);

		try {
			// HF_TOKEN 可選；ZeroGPU Space 匿名呼叫有配額限制，帶 token 較穩定
			const hfToken = process.env.HF_TOKEN;
			const app = await Client.connect(
				VOICE_CLONE_SPACE,
				hfToken ? { token: hfToken as `hf_${string}` } : undefined,
			);

			// endpoint 以 Space 的函式名命名（def clone(text, audio)），輸入為 [text, audio]
			const result = await app.predict("/clone", [storyText, audioBlob]);

			const outputData = result.data as Array<{ url?: string }>;
			const audioUrl = outputData?.[0]?.url;

			if (!audioUrl) {
				throw new Error("Gradio response did not contain audio URL.");
			}

			// 取得產生的音檔內容
			const audioResponse = await fetch(audioUrl);
			if (!audioResponse.ok) {
				throw new Error("Failed to fetch generated audio from Hugging Face.");
			}
			const audioBufferOut = await audioResponse.arrayBuffer();
			const audioBase64Out = Buffer.from(audioBufferOut).toString("base64");

			return NextResponse.json(
				{ audioBase64: audioBase64Out },
				{ headers: corsHeaders },
			);
		} catch (error) {
			console.warn("⚠️ Hugging Face 雲端語音服務無法連線或逾時。", error);
			return NextResponse.json(
				{
					audioBase64: null,
					message:
						"雲端語音生成失敗：Space 排隊滿載或 GPU 配額用盡，請稍後重試。（可在 .env.local 設定 HF_TOKEN 提高配額）",
				},
				{ headers: corsHeaders },
			);
		}
	} catch (error) {
		console.error("Error in clone-voice route:", error);
		return NextResponse.json(
			{ error: "Failed to process voice" },
			{ status: 500, headers: corsHeaders },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: corsHeaders,
	});
}
