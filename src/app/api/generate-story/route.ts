import { NextResponse } from "next/server";
import { globalRateLimiter } from "@/lib/rate-limiter";

export const maxDuration = 60;

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
			{ error: "請稍候再試，您的請求速度已達上限。" },
			{ status: 429, headers: corsHeaders },
		);
	}

	try {
		const { keyword, education, random } = await request.json();

		const randomKeywords = [
			"夢幻星辰森林", "勇敢的小狐狸", "秘密魔法城堡", "月光海洋冒險",
			"彩虹雲端音樂會", "友誼勇氣之旅", "夜間動物派對", "星空守護者",
			"魔法糖果花園", "小小發明家的奇遇"
		];

		const effectiveKeyword =
			random || !keyword?.trim()
				? randomKeywords[Math.floor(Math.random() * randomKeywords.length)]
				: keyword.trim();

		if (!effectiveKeyword) {
			return NextResponse.json({ error: "Keyword is required" }, { status: 400, headers: corsHeaders });
		}

		const teachingHint = education?.trim()
			? `故事中請自然傳達教育價值：「${education}」。`
			: `故事中請自然傳達正向教學主題，例如「不能輕易放棄」「不要半途而廢」「要誠實」「要有同理心」「勇於承擔責任」。`;
			
		const prompt = `你是一位專業兒童故事作家，請以關鍵字「${effectiveKeyword}」創作一個完整、合理且富有邏輯性的繁體中文睡前故事。故事要像 Google Gemini Storybook 一樣，並且必須：
- 有清楚的劇情脈絡與因果關係
- 角色擁有明確目標、情緒變化與成長
- 事件間自然連接，不要突然跳轉或遺漏動機
- 每個轉折都要推動故事前進，並帶出內心改變

請分成四個段落，但僅輸出故事本身，不要寫出任何章節標題或說明：
1. 起：介紹主角、陪伴角色、場景與願望或問題
2. 承：描述主角遇到的挑戰、困難與內心掙扎
3. 轉：刻畫主角採取行動、情緒變化與關鍵轉折
4. 合：以溫暖、正向的方式解決問題，並留下自然的學習價值

${teachingHint}

如果關鍵字很簡短，請自動延展成具體且新穎的主角、場景與冒險。全文務必使用繁體中文，篇幅約 600 到 800 字，適合孩童睡前閱讀。不要出現任何寫作提示、AI 語句、格式說明或額外附註。`;

		const apiKey = process.env.GROQ_API_KEY || "";

		const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: "llama3-70b-8192",
				messages: [{ role: "user", content: prompt }],
				temperature: 0.75,
				max_tokens: 1024,
				top_p: 0.9,
				stream: false
			}),
			signal: AbortSignal.timeout(30000),
		});

		if (!groqResponse.ok) {
			const errorText = await groqResponse.text();
			console.error("Groq API error:", errorText);
			throw new Error("無法連接 Groq 模型服務。");
		}

		const data = await groqResponse.json();
		const storyText = data?.choices?.[0]?.message?.content?.trim() || "";

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
