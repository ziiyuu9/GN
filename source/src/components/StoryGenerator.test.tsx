/// <reference types="vitest" />

import type { ReactElement } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as generateStoryPOST } from "../app/api/generate-story/route";
import { StoryGenerator } from "./StoryGenerator";

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = ReactDOM.createRoot(container);
	root.render(element);
	await new Promise((resolve) => setTimeout(resolve, 0));
	return { container, root };
}

describe("StoryGenerator", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = "";
	});

	it("disables submit when prompt is empty", async () => {
		const { container } = await render(<StoryGenerator />);
		const button = container.querySelector('button[type="submit"]');
		expect(button).toBeInstanceOf(HTMLButtonElement);
		expect(button?.hasAttribute("disabled")).toBe(true);
	});

	it("generates a story through the API route handler", async () => {
		const storyText = "這是一個測試故事。";
		const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
			ok: true,
			json: async () => ({ response: storyText }),
		} as any);

		const request = new Request("http://localhost/api/generate-story", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ keyword: "勇敢貓咪" }),
		});

		const response = await generateStoryPOST(request);
		const data = await response.json();

		expect(fetchSpy).toHaveBeenCalled();
		expect(data.story).toContain("這是一個測試故事。");
	});
});
