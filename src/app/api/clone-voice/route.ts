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
		const promptText = formData.get("promptText") as string | null;

		if (!audioBlob || !storyText || !promptText) {
			return NextResponse.json(
				{ error: "Audio file, story text, and prompt text are required" },
				{ status: 400, headers: corsHeaders },
			);
		}

		console.log("Connecting to Hugging Face Gradio Space (Splend1dchan/BreezyVoice-Playground)...");
		
		try {
			// 初始化 Gradio Client，改接聯發科的 BreezyVoice
			const app = await client("Splend1dchan/BreezyVoice-Playground");
			
			// 呼叫 /generate_audio API
			// 參數順序: [目標文本, 樣本文本, 上傳音檔, 錄製音檔, 種子碼, 來源選擇]
			const result = await app.predict("/generate_audio", [
				storyText,          // 目標故事文字
				promptText,         // 音檔的逐字稿 (BreezyVoice的特點)
				audioBlob,          // 當作上傳音檔傳入 (Blob格式相容)
				null,               // 錄製音檔留空 (前端都統一當作File/Blob送過來)
				Math.floor(Math.random() * 10000), // 給個隨機種子
				"上傳檔案"          // 對應 Radio 的選項
			]);

			// Gradio 回傳的 result.data 是一個陣列，包含音檔物件
			const outputData = result.data as any[];
			const audioObj = outputData[0];
			
			// Gradio 舊版回傳 url，新版回傳 { url }
			const audioUrl = typeof audioObj === "string" ? audioObj : audioObj?.url;

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
		} catch (error: any) {
			console.warn("⚠️ Hugging Face 雲端語音服務無法連線或逾時。", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			return NextResponse.json(
				{
					audioBase64: null,
					message: `BreezyVoice 生成逾時或出錯: ${error?.message || "請稍後重試。"}`,
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
