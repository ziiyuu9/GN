"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MagicButton } from "./MagicButton";

export function StoryGenerator() {
	const [prompt, setPrompt] = useState("");
	const [story, setStory] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		setIsGenerating(true);
		setStory("");
		setError("");

		try {
			const res = await fetch("/api/generate-story", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ keyword: prompt }),
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
				gap: "1rem",
				marginTop: "1rem",
			}}
		>
			<form
				onSubmit={handleGenerate}
				style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
			>
				<input
					type="text"
					placeholder="例如：一隻勇敢探索星空的貓咪..."
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					disabled={isGenerating}
					style={{ width: "100%", boxSizing: "border-box" }}
				/>
				<MagicButton type="submit" disabled={isGenerating || !prompt.trim()}>
					{isGenerating ? "生成中..." : "開始說故事"}
				</MagicButton>
			</form>

			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#fda4af", fontSize: "0.95rem", marginTop: "0.5rem" }}
				>
					{error}
				</motion.div>
			)}

			{story && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					style={{
						marginTop: "1.5rem",
						padding: "1.5rem",
						background: "rgba(15, 23, 42, 0.46)",
						borderRadius: "var(--radius-md)",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						textAlign: "left",
						lineHeight: "1.9",
						color: "#cbd5e1",
						maxHeight: "320px",
						overflowY: "auto",
					}}
				>
					<span style={{ whiteSpace: "pre-wrap" }}>{story}</span>
				</motion.div>
			)}
		</div>
	);
}
