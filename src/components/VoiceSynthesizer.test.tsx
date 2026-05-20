/// <reference types="vitest" />

import type { ReactElement } from "react";
import ReactDOM from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as cloneVoicePOST } from "../app/api/clone-voice/route";
import { VoiceSynthesizer } from "./VoiceSynthesizer";

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = ReactDOM.createRoot(container);
	root.render(element);
	await new Promise((resolve) => setTimeout(resolve, 0));
	return { container, root };
}

describe("VoiceSynthesizer", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = "";
	});

	it("renders upload area and disables submit without file or text", async () => {
		const { container } = await render(<VoiceSynthesizer />);
		expect(container.textContent).toContain("點擊上傳欲克隆的聲音樣本");
		const button = container.querySelector('button[type="submit"]');
		expect(button).toBeInstanceOf(HTMLButtonElement);
		expect(button?.hasAttribute("disabled")).toBe(true);
	});

	it("clones voice through the API route handler", async () => {
		const fakeBase64 =
			"UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";
		const fakeBytes = new Uint8Array(Buffer.from(fakeBase64, "base64"));
		const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
			ok: true,
			arrayBuffer: async () => fakeBytes.buffer,
		} as any);

		const request = {
			headers: new Headers(),
			formData: async () => {
				const formData = new FormData();
				formData.append("story", "晚安，祝你有個好夢。");
				formData.append(
					"audio",
					new File(["dummy"], "sample.wav", { type: "audio/wav" }),
				);
				return formData;
			},
		} as unknown as Request;

		const response = await cloneVoicePOST(request);
		const data = await response.json();

		expect(fetchSpy).toHaveBeenCalled();
		expect(data.audioBase64).toBe(fakeBase64);
	});
});
