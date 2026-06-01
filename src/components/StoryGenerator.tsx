"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function StoryGenerator() {
	const [prompt, setPrompt] = useState("");
	const [education, setEducation] = useState("");
	const [provider, setProvider] = useState("ollama");
	const [story, setStory] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");
	const [useRandom, setUseRandom] = useState(false);

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!useRandom && !prompt.trim()) {
			setError("請輸入故事關鍵字或啟用隨機生成。\uD83C\uDF81");
			return;
		}

		setIsGenerating(true);
		setStory("");
		setError("");

		try {
			const res = await fetch("/api/generate-story", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ keyword: prompt, education, provider, random: useRandom }),
			});

			const data = await res.json();
			if (!res.ok || !data.story) {
				throw new Error(data.error || "無法生成故事，請稍後再試。");
			}

			setStory(data.story);
		} catch (err: any) {
			console.error(err);
			setError(err?.message || "系統發生錯誤，請稍後再試。");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
				marginTop: "1.5rem",
				alignItems: "center",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: "780px",
					background: "linear-gradient(180deg, #fff9f1 0%, #f7efe1 48%, #f2e4d4 100%)",
					border: "1px solid rgba(156, 121, 80, 0.28)",
					borderRadius: "40px",
					boxShadow: "0 38px 100px rgba(15, 23, 42, 0.14)",
					padding: "2rem",
					position: "relative",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "1.25rem",
						left: "1.25rem",
						width: "72px",
						height: "72px",
						borderRadius: "24px",
						border: "2px solid rgba(156, 121, 80, 0.24)",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.85)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "1.25rem",
						right: "1.25rem",
						width: "60px",
						height: "60px",
						background: "radial-gradient(circle at center, rgba(255,255,255,0.75), rgba(255,255,255,0) 55%)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: "1.5rem",
						right: "1.5rem",
						width: "84px",
						height: "84px",
						borderRadius: "28px",
						background: "linear-gradient(135deg, rgba(255, 235, 202, 0.8), rgba(255, 255, 255, 0.1))",
						border: "1px solid rgba(156, 121, 80, 0.15)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: "2rem",
						left: "2rem",
						width: "88px",
						height: "20px",
						background: "rgba(217, 156, 89, 0.1)",
						borderRadius: "999px",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "1rem",
						left: "1.5rem",
						right: "1.5rem",
						height: "1px",
						background: "rgba(156, 121, 80, 0.18)",
					}}
				/>
				<div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
					<div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#b58847" }} />
					<div>
						<div style={{ color: "#8d6c4d", fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
							故事書頁面
						</div>
						<div style={{ fontSize: "1.65rem", fontWeight: 700, color: "#3d2b17" }}>
							開始你的床邊故事
						</div>
					</div>
				</div>

				<form
					onSubmit={handleGenerate}
					style={{ display: "grid", gap: "1.3rem" }}
				>
					<div style={{ display: "grid", gap: "0.75rem" }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
							<span style={{ color: "#7e5d3d", fontSize: "0.95rem", fontWeight: 600 }}>
								故事關鍵字
							</span>
							<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
								<input
									type="checkbox"
									checked={useRandom}
									onChange={(e) => {
										setUseRandom(e.target.checked);
										if (e.target.checked) setError("");
									}}
									style={{ width: "1rem", height: "1rem" }}
								/>
								<span style={{ color: "#8c7154", fontSize: "0.88rem" }}>
									隨機生成故事
								</span>
							</label>
						</div>
						<input
							type="text"
							placeholder={useRandom ? "系統將自動選擇故事主題" : "例如：勇敢的小狐狸、星空冒險、秘密魔法森林..."}
							value={prompt}
							onChange={(e) => {
								setPrompt(e.target.value);
								if (error) {
									setError("");
								}
							}}
							disabled={isGenerating || useRandom}
							aria-label="故事關鍵字"
							style={{
								width: "100%",
								padding: "1rem 1.1rem",
								borderRadius: "18px",
								border: "1px solid rgba(156, 121, 80, 0.28)",
								background: useRandom ? "#f3efe6" : "#fffdf5",
								color: "#3c2a18",
								fontSize: "1rem",
								boxSizing: "border-box",
							}}
						/>
						<span style={{ color: "#8c7154", fontSize: "0.88rem" }}>
							可輸入角色、場景或主題，例如「失落星辰的小狐狸」、「夜空中的音樂會」、「友誼魔法森林」。
						</span>
					</div>

					<label style={{ display: "grid", gap: "0.5rem" }}>
						<span style={{ color: "#7e5d3d", fontSize: "0.95rem", fontWeight: 600 }}>
							教育價值
						</span>
						<input
							type="text"
							placeholder="例如：誠實、同理心、不要半途而廢..."
							value={education}
							onChange={(e) => {
								setEducation(e.target.value);
								if (error) {
									setError("");
								}
							}}
							disabled={isGenerating}
							aria-label="教育價值"
							style={{
								width: "100%",
								padding: "1rem 1.1rem",
								borderRadius: "18px",
								border: "1px solid rgba(156, 121, 80, 0.28)",
								background: "#fffdf5",
								color: "#3c2a18",
								fontSize: "1rem",
								boxSizing: "border-box",
							}}
						/>
						<span style={{ color: "#8c7154", fontSize: "0.88rem" }}>
							請輸入希望故事傳達的教學主題，例如誠實、堅持、同理心、責任感。
						</span>
					</label>

					<label style={{ display: "grid", gap: "0.5rem" }}>
						<span style={{ color: "#7e5d3d", fontSize: "0.95rem", fontWeight: 600 }}>
							生成供應商
						</span>
						<select
							value={provider}
							onChange={(e) => setProvider(e.target.value)}
							disabled={isGenerating}
							style={{
								width: "100%",
								padding: "1rem 1.1rem",
								borderRadius: "18px",
								border: "1px solid rgba(156, 121, 80, 0.28)",
								background: "#fffdf5",
								color: "#3c2a18",
								fontSize: "1rem",
								boxSizing: "border-box",
							}}
						>
							<option value="ollama">本地 Ollama</option>
							<option value="text-generation-webui">
								Text Generation WebUI（開源）
							</option>
						</select>
						<span style={{ color: "#8c7154", fontSize: "0.88rem" }}>
							如果你已經運行本地開源 WebUI，請選擇 Text Generation WebUI，並確認 STORY_BASE_URL 指向該服務。
						</span>
					</label>

					<button
						type="submit"
						disabled={isGenerating || (!useRandom && !prompt.trim())}
						style={{
							background: "linear-gradient(135deg, #9b76d1, #f47fb6)",
							color: "white",
							border: "none",
							padding: "1rem 2rem",
							borderRadius: "999px",
							cursor: isGenerating || (!useRandom && !prompt.trim()) ? "not-allowed" : "pointer",
							fontSize: "1rem",
							fontWeight: 700,
							boxShadow: "0 16px 32px rgba(155, 118, 209, 0.22)",
							transition: "transform 0.2s ease, box-shadow 0.2s ease",
						}}
					>
						{isGenerating ? "生成中..." : "開始說故事"}
					</button>
				</form>

				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						style={{ color: "#d94667", fontSize: "0.95rem", marginTop: "1rem" }}
					>
						{error}
					</motion.div>
				)}
			</div>

			{story && (
				<motion.div
					initial={{ opacity: 0, scale: 0.97 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					style={{
						width: "100%",
						maxWidth: "780px",
						background: "linear-gradient(180deg, #fff8ef 0%, #fff1de 35%, #f8e3cf 100%)",
						border: "1px solid rgba(167, 128, 88, 0.2)",
						borderRadius: "42px",
						boxShadow: "0 32px 90px rgba(15, 23, 42, 0.14)",
						padding: "2rem",
						color: "#3c2f20",
						fontFamily: "Georgia, 'Times New Roman', serif",
						lineHeight: 1.95,
						letterSpacing: "0.01em",
						textAlign: "left",
						minHeight: "360px",
						position: "relative",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							position: "absolute",
							top: "1.5rem",
							left: "1.5rem",
							width: "70px",
							height: "70px",
							borderRadius: "20px",
							border: "2px solid rgba(203, 142, 73, 0.24)",
							boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.8)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							top: "2rem",
							right: "2rem",
							width: "110px",
							height: "110px",
							borderRadius: "999px",
							background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.8), rgba(255,255,255,0) 60%)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							bottom: "1.5rem",
							left: "2rem",
							width: "100px",
							height: "30px",
							background: "rgba(217, 156, 89, 0.12)",
							borderRadius: "999px",
						}}
					/>
					<div
						style={{
							position: "absolute",
							bottom: "2rem",
							right: "3rem",
							width: "52px",
							height: "52px",
							borderRadius: "20px",
							background: "rgba(255, 235, 205, 0.35)",
						}}
					/>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
						<div style={{ color: "#8d6b4b", fontSize: "0.9rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
							床邊故事書
						</div>
						<div style={{ color: "#b08a5f", fontSize: "0.85rem" }}>
							每次都是新的溫暖冒險
						</div>
					</div>
					<div style={{ whiteSpace: "pre-wrap", textIndent: "1.4em" }}>{story}</div>
				</motion.div>
			)}
		</div>
	);
}
