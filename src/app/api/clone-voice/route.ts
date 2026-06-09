import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";
import { client } from "@gradio/client";

export const maxDuration = 60; // 允許較長的 Vercel 執行時間

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

		console.log("Connecting to Hugging Face Gradio Space (tonyassi/voice-clone)...");
		
		try {
			// 初始化 Gradio Client
			const app = await client("tonyassi/voice-clone");
			
			// 呼叫語音複製預測介面
			// 根據 API 文件，輸入為: [text, audio Blob]
			const result = await app.predict("/clone", [
				storyText,
				audioBlob,
			]);

			// Gradio 回傳的 result.data 是一個陣列，包含音檔物件
			const outputData = result.data as any[];
			const audioUrl = outputData[0]?.url;

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
				{ headers: corsHeaders }
			);
		} catch (error) {
			console.warn("⚠️ Hugging Face 雲端語音服務無法連線或逾時。", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			return NextResponse.json(
				{
					audioBase64: null,
					message: "雲端語音生成逾時或排隊人數過多，請稍後重試。 (Hugging Face Spaces Queue Full)",
				},
				{ headers: corsHeaders }
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
