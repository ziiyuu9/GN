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
			{ error: "請稍候再試，您的請求速度已達上限。" },
			{ status: 429, headers: corsHeaders },
		);
	}

	try {
		const { keyword, education, provider, random } = await request.json();

		const randomKeywords = [
			"夢幻星辰森林",
			"勇敢的小狐狸",
			"秘密魔法城堡",
			"月光海洋冒險",
			"彩虹雲端音樂會",
			"友誼勇氣之旅",
			"夜間動物派對",
			"星空守護者",
			"魔法糖果花園",
			"小小發明家的奇遇",
		];

		const effectiveKeyword =
			random || !keyword?.trim()
				? randomKeywords[Math.floor(Math.random() * randomKeywords.length)]
				: keyword.trim();

		if (!effectiveKeyword) {
			return NextResponse.json(
				{ error: "Keyword is required" },
				{ status: 400, headers: corsHeaders },
			);
		}

		const storyBaseUrl =
			process.env.STORY_BASE_URL ||
			process.env.OLLAMA_BASE_URL ||
			"http://localhost:11434";
		const storyApiPath =
			process.env.STORY_API_PATH ||
			(provider === "text-generation-webui" ? "/generate" : "/api/generate");
		const model =
			process.env.STORY_MODEL || process.env.OLLAMA_MODEL || "llama3";
		const teachingHint = education?.trim()
			? `故事中請自然傳達教育價值：「${education}」。`
			: `故事中請自然傳達正向教學主題，例如「不能輕易放棄」「不要半途而廢」「要誠實」「要有同理心」「勇於承擔責任」。`;
		const prompt = `你是一位專業兒童故事作家，請以關鍵字「${keyword}」創作一個完整、合理且富有邏輯性的繁體中文睡前故事。故事要像 Google Gemini Storybook 一樣，並且必須：
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

如果關鍵字很簡短，請自動延展成具體且新穎的主角、場景與冒險。全文務必使用繁體中文，篇幅約 700 到 900 字，適合孩童睡前閱讀。不要出現任何寫作提示、AI 語句、格式說明或額外附註。`;

		const requestBody =
			provider === "text-generation-webui"
				? {
						prompt,
						max_new_tokens: 900,
						temperature: 0.75,
						top_p: 0.9,
						do_sample: true,
					}
				: { model, prompt, stream: false };

		try {
			const ollamaResponse = await fetch(`${storyBaseUrl}${storyApiPath}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
				signal: AbortSignal.timeout(4000),
			});

			if (!ollamaResponse.ok) {
				throw new Error(
					"無法連接本地故事生成模型服務。請確認 STORY_BASE_URL 或 OLLAMA_BASE_URL 是否正確。",
				);
			}

			const data = await ollamaResponse.json();
			const storyText =
				(provider === "text-generation-webui"
					? data?.results?.[0]?.generated_text ||
						data?.text ||
						data?.response ||
						data?.output_text
					: (data?.response ?? data)) ?? "";
			return NextResponse.json({ story: storyText }, { headers: corsHeaders });
		} catch (error) {
			console.warn("⚠️ [Mock Mode] Ollama 無法連線，啟動本地模擬回應。", error);
			await new Promise((resolve) => setTimeout(resolve, 1200));

			return NextResponse.json(
				{
					story: `(Mock Response) 在很久很久以前，夜色柔和的 ${keyword} 森林裡住著一位小小的月光精靈。牠每天的工作是為落葉樹上的小朋友們點亮夜燈，但這次牠遇到了一個讓妳思考的挑戰：夜晚的星光逐漸消失，森林裡的小動物們開始懷疑自己是否還能完成夢想。
					精靈起初覺得無助，但牠沒有放棄。牠耐心地和小鹿、積木兔一起尋找光芒，每天嘗試不同的方法。當牠想要放棄時，朋友們告訴牠：「只要不半途而廢，奇蹟就會慢慢出現。」
					終於，精靈在一片安靜的蘑菇莊園裡找到了一顆隱藏的星光種子。這個過程讓牠明白：誠實面對自己的害怕、勇敢承認需要幫助、並用同理心聆聽別人的想法，才是真正的力量。
					最後，當星光再次洒滿森林，大家唱著感謝的歌，精靈也知道成長不是一蹴而就，而是一步步努力、沒有放棄的旅程。`,
				},
				{ headers: corsHeaders }
			);
		}
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
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
