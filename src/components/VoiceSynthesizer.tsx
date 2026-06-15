"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
	const [promptText, setPromptText] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [sampleUrl, setSampleUrl] = useState<string | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [recorderError, setRecorderError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);

	const canRecord =
		typeof navigator !== "undefined" &&
		navigator.mediaDevices?.getUserMedia !== undefined;

	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	useEffect(() => {
		return () => {
			if (sampleUrl) {
				URL.revokeObjectURL(sampleUrl);
			}
		};
	}, [sampleUrl]);

	useEffect(() => {
		return () => {
			mediaStreamRef.current?.getTracks().forEach((track) => {
				track.stop();
			});
		};
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
			if (sampleUrl) {
				URL.revokeObjectURL(sampleUrl);
				setSampleUrl(null);
			}
		}
	};

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || !promptText.trim() || !file) return;

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
			formData.append("promptText", promptText);

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

	const startRecording = async () => {
		setRecorderError("");
		if (!canRecord) {
			setRecorderError("您的瀏覽器不支援錄音功能。請改用上傳音檔。");
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamRef.current = stream;
			const chunks: Blob[] = [];
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;

			recorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0) {
					chunks.push(event.data);
				}
			};

			recorder.onstop = () => {
				const blob = new Blob(chunks, {
					type: chunks[0]?.type || "audio/webm",
				});
				const recordedFile = new File([blob], "recording.webm", {
					type: blob.type,
				});
				setFile(recordedFile);
				if (sampleUrl) {
					URL.revokeObjectURL(sampleUrl);
				}
				setSampleUrl(URL.createObjectURL(blob));
				stream.getTracks().forEach((track) => {
					track.stop();
				});
				mediaStreamRef.current = null;
				mediaRecorderRef.current = null;
				setIsRecording(false);
				setInfo("錄音已完成，您可以進行聲音克隆。");
			};

			recorder.onerror = () => {
				setRecorderError("錄音失敗，請重新嘗試。");
				setIsRecording(false);
				stream.getTracks().forEach((track) => {
					track.stop();
				});
				mediaStreamRef.current = null;
				mediaRecorderRef.current = null;
			};

			recorder.start(250);
			setIsRecording(true);
			setInfo("正在錄音中，請說話... (若播放無聲，請檢查系統或瀏覽器麥克風音量設定)");
		} catch (err) {
			console.error(err);
			setRecorderError("無法啟動麥克風，請允許麥克風存取。");
		}
	};

	const stopRecording = () => {
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== "inactive"
		) {
			mediaRecorderRef.current.stop();
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
				<button
					type="button"
					onClick={() => !isGenerating && fileInputRef.current?.click()}
					disabled={isGenerating}
					style={{
						display: "block",
						textAlign: "left",
						border: "2px dashed rgba(255,255,255,0.2)",
						borderRadius: "var(--radius-md)",
						padding: "1.8rem",
						cursor: isGenerating ? "default" : "pointer",
						background: "rgba(15, 23, 42, 0.46)",
						transition: "all 0.3s ease",
						pointerEvents: isGenerating ? "none" : "auto",
						opacity: isGenerating ? 0.7 : 1,
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
				</button>

				<textarea
					placeholder="音訊樣本文本：請輸入您剛才錄音或上傳音檔中，逐字逐句說出的內容。這能幫助模型精準對齊您的聲音特徵。"
					value={promptText}
					onChange={(e) => setPromptText(e.target.value)}
					disabled={isGenerating}
					rows={2}
					style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
				/>

				<textarea
					placeholder="請輸入想要合成的故事文本，建議 1-2 句完整中文句子。"
					value={text}
					onChange={(e) => setText(e.target.value)}
					disabled={isGenerating}
					rows={4}
					style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
				/>

				<MagicButton
					type="submit"
					variant="secondary"
					disabled={isGenerating || !text.trim() || !promptText.trim() || !file}
					aria-busy={isGenerating}
				>
					{isGenerating ? "語音合成中..." : "生成克隆語音"}
				</MagicButton>
			</form>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
					gap: "0.75rem",
				}}
			>
				<MagicButton
					type="button"
					variant="secondary"
					disabled={isGenerating || isRecording}
					onClick={startRecording}
				>
					{isRecording ? "錄音中..." : "開始錄音"}
				</MagicButton>
				<MagicButton
					type="button"
					variant="secondary"
					disabled={!isRecording}
					onClick={stopRecording}
				>
					停止錄音
				</MagicButton>
			</div>

			{recorderError && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#fca5a5", fontSize: "0.95rem", marginTop: "0.5rem" }}
					role="alert"
					aria-live="assertive"
				>
					{recorderError}
				</motion.div>
			)}

			{sampleUrl && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ marginTop: "0.75rem" }}
				>
					<p style={{ color: "#cbd5e1", margin: 0, marginBottom: "0.5rem" }}>
						已錄製樣本：
					</p>
					<audio controls src={sampleUrl} style={{ width: "100%" }} />
				</motion.div>
			)}

			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#fda4af", fontSize: "0.95rem", marginTop: "0.5rem" }}
					role="alert"
					aria-live="assertive"
				>
					{error}
				</motion.div>
			)}

			{info && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#a5f3fc", fontSize: "0.95rem", marginTop: "0.5rem" }}
					role="status"
					aria-live="polite"
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
