import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export async function POST(request: Request) {
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"127.0.0.1";
	if (!globalRateLimiter.check(ip)) {
		return NextResponse.json(
			{ error: "請稍候再試，您的請求速度已達上限。" },
			{ status: 429 },
		);
	}

	try {
		const { keyword } = await request.json();
		if (!keyword) {
			return NextResponse.json(
				{ error: "Keyword is required" },
				{ status: 400 },
			);
		}

		const ollamaBaseUrl =
			process.env.OLLAMA_BASE_URL || "http://localhost:11434";
		const model = process.env.OLLAMA_MODEL || "llama3";
		const prompt = `請以關鍵字：「${keyword}」為主題，創作一個身歷其境且充滿魔幻色彩的床邊故事。故事長度約 300 到 500 字，適合孩童睡前聆聽。請務必使用繁體中文，並避免任何 Markdown 標記。`;

		try {
			const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ model, prompt, stream: false }),
				signal: AbortSignal.timeout(4000),
			});

			if (!ollamaResponse.ok) {
				throw new Error("無法連接本地 Ollama。");
			}

			const data = await ollamaResponse.json();
			return NextResponse.json({ story: data.response ?? data });
		} catch (error) {
			console.warn("⚠️ [Mock Mode] Ollama 無法連線，啟動本地模擬回應。", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));

			return NextResponse.json({
				story: `(Mock Response) 在很久很久以前，發著微光的 ${keyword} 森林深處，有一位小小精靈發現了一顆隱藏的水晶。這顆水晶散發著古老的能量，似乎在等待真正的英雄來臨。今晚的夢境將伴隨著你，進入一段溫柔而奇幻的冒險。`,
			});
		}
	} catch (error) {
		console.error("Error generating story:", error);
		return NextResponse.json(
			{ error: "Failed to generate story" },
			{ status: 500 },
		);
	}
}
