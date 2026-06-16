import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export const maxDuration = 60;

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "ziiyuu9/goodnight-llama3";



async function generateWithOllama(prompt: string): Promise<string> {
	const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: OLLAMA_MODEL,
			system: "你是一位專門為台灣兒童寫睡前故事的作家。你的最高指導原則是：「絕對且嚴格地」全程只使用繁體中文。絕對不可夾雜任何英文字母、英文單字或外文。你的所有回答必須 100% 是繁體中文。",
			prompt,
			stream: false,
			options: { temperature: 0.6, top_p: 0.9 },
		}),
		signal: AbortSignal.timeout(300000),
	});

	if (!ollamaResponse.ok) {
		const errorText = await ollamaResponse.text();
		console.error("Ollama API error:", errorText);
		throw new Error("無法連接本地 Ollama 服務。");
	}

	const data = await ollamaResponse.json();
	return data?.response?.trim() || "";
}

export async function POST(request: Request) {
	const ip =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"127.0.0.1";
	if (!globalRateLimiter.check(ip)) {
		return NextResponse.json(
			{ error: "請稍候再試，您的請求速度已達上限。" },
			{ status: 429, headers: corsHeaders },
		);
	}

	try {
		const { keyword, random } = await request.json();

		const randomKeywords = [
			"一隻想飛的胖企鵝 友誼與勇氣 冰山探險",
			"怕黑的小恐龍 學習面對恐懼 神秘星辰洞穴",
			"不會魔法的精靈 發現自己的長處 魔法森林",
			"愛生氣的紅雲 學習情緒管理 天空之城",
			"常常半途而廢的小松鼠 堅持到底 收集過冬果實",
			"喜歡分享的小蜜蜂 團隊合作與分享 彩虹花園",
			"說了謊的小木偶 誠實的力量 歡樂馬戲團",
			"迷路的星星 同理心與互相幫助 夜空尋家"
		];

		const effectiveKeyword =
			random || !keyword?.trim()
				? randomKeywords[Math.floor(Math.random() * randomKeywords.length)]
				: keyword.trim();

		if (!effectiveKeyword) {
			return NextResponse.json({ error: "Keyword is required" }, { status: 400, headers: corsHeaders });
		}
			
		const prompt = `你是一位專業的兒童睡前故事作家，專門為小朋友撰寫像 Google Gemini Storybook 那樣高品質、有教育意義且邏輯嚴謹的故事。
現在有一位家長提供了以下關鍵字或主題：
「${effectiveKeyword}」

請根據上述家長給的提示，創作一個約 300-400 字的短篇繁體中文睡前故事。故事必須具備以下特點：
1. 適合兒童：用語溫暖、生動、具象化，無任何暴力、恐怖或不適合兒童的情節。
2. 邏輯與篇幅：故事需有明確的起、承、轉、合，不要草率結束。角色要有動機、遇到挑戰、內心產生變化並最終獲得成長。
3. 教育意義：請將家長提供的關鍵字自然地融入情節中，如果家長有提到教育寓意（如不放棄、誠實、同理心），請在情節轉折與結尾處自然帶出這個正向價值觀，不要用說教的方式，而是讓主角親身體會。
4. 純中文限制：這是給台灣小朋友看的故事，請「絕對且嚴格地」全程只使用繁體中文，絕對不可夾雜任何英文或其他語言（不要出現任何英文字母、英文單字或句子）。

請直接輸出故事內容，不需要給故事標題，不需要額外的問候語或註解。請確保段落分明，讓孩子聽了感到安心且充滿啟發。`;

		// 完全回歸本地端：強制只使用 Ollama
		let storyText = "";
		try {
			storyText = await generateWithOllama(prompt);
			// 【終極殺手鐧】強制濾除所有英文字母，防止小模型的「語言混亂幻覺」
			storyText = storyText.replace(/[a-zA-Z]/g, '');
		} catch (error) {
			console.error("Ollama failed:", error);
			return NextResponse.json(
				{ error: `無法連線至本地端 Ollama（${OLLAMA_BASE_URL}）。請確認您已在電腦上開啟 Ollama 應用程式。` },
				{ status: 503, headers: corsHeaders },
			);
		}

		return NextResponse.json({ story: storyText }, { headers: corsHeaders });
	} catch (error) {
		console.error("Error generating story:", error);
		return NextResponse.json(
			{ error: "Failed to generate story" },
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
