import { expect, test } from "@playwright/test";

test.describe("GoodNight UI Flow", () => {
	test("should render main page correctly and verify elements", async ({
		page,
	}) => {
		await page.goto("/");

		// 驗證首頁標題
		await expect(page.locator("h1")).toHaveText("咕奈 GoodNight");
		await expect(page.locator(".subtitle")).toHaveText(
			"私人化 AI 床邊故事與語音陪伴系統，支援本地 Ollama 與 TTS 服務。",
		);

		// 驗證「生成床邊故事」區塊
		await expect(
			page.locator("h2").filter({ hasText: "生成床邊故事" }),
		).toBeVisible();
		const storyInput = page.locator(
			'input[placeholder="例如：一隻勇敢探索星空的貓咪..."]',
		);
		await expect(storyInput).toBeVisible();

		const generateBtn = page.locator('button:has-text("開始說故事")');
		await expect(generateBtn).toBeVisible();
		await expect(generateBtn).toBeDisabled(); // 預設為停用（因未輸入內容）

		// 輸入文字後應啟用按鈕
		await storyInput.fill("一隻勇敢的 Cyberpunk 貓咪");
		await expect(generateBtn).toBeEnabled();

		// 驗證「高擬真語音合成」區塊
		await expect(
			page.locator("h2").filter({ hasText: "克隆語音合成" }),
		).toBeVisible();
		const textInput = page.locator(
			'textarea[placeholder="請輸入想要合成的語音文本，建議 1-2 句完整中文句子。"]',
		);
		await expect(textInput).toBeVisible();

		const synthBtn = page.locator('button:has-text("生成克隆語音")');
		await expect(synthBtn).toBeVisible();
		await expect(synthBtn).toBeDisabled(); // 預設為停用（因未輸入內容且未上傳檔案）
	});
});
