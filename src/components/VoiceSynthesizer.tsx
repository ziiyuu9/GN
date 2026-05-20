"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { MagicButton } from "./MagicButton";

function decodeBase64ToBlob(base64: string, mimeType = "audio/wav") {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new Blob([bytes], { type: mimeType });
}

export function VoiceSynthesizer() {
	const [text, setText] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
		}
	};

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || !file) return;

		setIsGenerating(true);
		setError("");
		setInfo("");

		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			setAudioUrl(null);
		}

		try {
			const formData = new FormData();
			formData.append("audio", file);
			formData.append("story", text);

			const res = await fetch("/api/clone-voice", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "語音合成失敗，請稍後再試。");
			}

			if (data.audioBase64) {
				const blob = decodeBase64ToBlob(data.audioBase64, "audio/wav");
				const url = URL.createObjectURL(blob);
				setAudioUrl(url);
				setInfo("克隆語音已準備完成，請按下播放按鈕收聽。");
			} else {
				setInfo(data.message || "本地語音服務未啟動，已進入模擬模式。");
			}
		} catch (err: any) {
			console.error(err);
			setError(err?.message || "無法連線到語音服務，請稍後再試。");
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
				<div
					onClick={() => fileInputRef.current?.click()}
					style={{
						border: "2px dashed rgba(255,255,255,0.2)",
						borderRadius: "var(--radius-md)",
						padding: "1.8rem",
						cursor: "pointer",
						background: "rgba(15, 23, 42, 0.46)",
						transition: "all 0.3s ease",
					}}
				>
					<input
						type="file"
						accept="audio/*"
						ref={fileInputRef}
						onChange={handleFileChange}
						style={{ display: "none" }}
					/>
					{file ? (
						<span style={{ color: "#a78bfa" }}>
							已選擇語音檔案: {file.name}
						</span>
					) : (
						<span style={{ color: "#94a3b8" }}>
							點擊上傳欲克隆的聲音樣本 (.wav, .mp3)
						</span>
					)}
				</div>

				<textarea
					placeholder="請輸入想要合成的語音文本，建議 1-2 句完整中文句子。"
					value={text}
					onChange={(e) => setText(e.target.value)}
					disabled={isGenerating}
					rows={4}
					style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
				/>

				<MagicButton
					type="submit"
					variant="secondary"
					disabled={isGenerating || !text.trim() || !file}
				>
					{isGenerating ? "語音合成中..." : "生成克隆語音"}
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

			{info && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#a5f3fc", fontSize: "0.95rem", marginTop: "0.5rem" }}
				>
					{info}
				</motion.div>
			)}

			{audioUrl && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					style={{ marginTop: "1rem" }}
				>
					<audio
						controls
						src={audioUrl}
						style={{ width: "100%", outline: "none" }}
					/>
				</motion.div>
			)}
		</div>
	);
}
