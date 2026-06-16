import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";
import { client, handle_file } from "@gradio/client";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";

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

		const uploadedFile = formData.get("audio") as File;
		const arrayBuffer = await uploadedFile.arrayBuffer();
		
		// 為了確保 Gradio 能夠正確辨識檔案名稱與格式，我們必須寫入本地暫存檔，並使用 handle_file 進行標準上傳
		const tempFilePath = join(tmpdir(), `gradio_upload_${Date.now()}_audio.wav`);
		writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

		console.log("Connecting to Hugging Face Gradio Space (Splend1dchan/BreezyVoice-Playground)...");
		
		try {
			const app = await client("Splend1dchan/BreezyVoice-Playground");
			
			// 避免字數過長導致 HF Space 當機或排隊超過 30 分鐘
			const truncatedText = storyText.length > 150 ? storyText.substring(0, 150) : storyText;

			const result = await app.predict("/generate_audio", [
				truncatedText,      // 目標故事文字
				promptText,         // 音檔的逐字稿
				handle_file(tempFilePath), // 正確使用 handle_file 上傳，產生完整的 Gradio FileData
				null,               
				Math.floor(Math.random() * 10000),
				"上傳檔案"
			]);

			const outputData = result.data as any[];
			const audioObj = outputData[0];
			const audioUrl = typeof audioObj === "string" ? audioObj : audioObj?.url;

			if (!audioUrl) throw new Error("Gradio response missing URL");

			const audioResponse = await fetch(audioUrl);
			if (!audioResponse.ok) throw new Error("Failed to fetch audio");
			
			const audioBufferOut = await audioResponse.arrayBuffer();
			const audioBase64Out = Buffer.from(audioBufferOut).toString("base64");

			try { unlinkSync(tempFilePath); } catch (e) {}

			return NextResponse.json(
				{ audioBase64: audioBase64Out },
				{ headers: corsHeaders }
			);
		} catch (error: any) {
			console.warn("⚠️ Hugging Face 雲端語音服務無法連線或逾時。", error);
			try { unlinkSync(tempFilePath); } catch (e) {} // 失敗也要清除暫存檔
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
