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

async function convertToWav(blob: Blob): Promise<File> {
	// 強制設定為 16000 Hz 採樣率，以符合大多數 AI 語音模型的底層要求
	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
	const arrayBuffer = await blob.arrayBuffer();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	
	// 強制轉為單聲道 Mono (避免雙聲道資料傳到後端時發生交錯錯亂)
	const numOfChannels = 1; 
	const length = audioBuffer.length * numOfChannels * 2 + 44;
	const buffer = new ArrayBuffer(length);
	const view = new DataView(buffer);
	const channelData = audioBuffer.getChannelData(0); // 只取第一個聲道
	let pos = 0;
	
	function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
	function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
	
	setUint32(0x46464952); // "RIFF"
	setUint32(length - 8);
	setUint32(0x45564157); // "WAVE"
	setUint32(0x20746d66); // "fmt "
	setUint32(16);
	setUint16(1); // PCM
	setUint16(numOfChannels); // 1
	setUint32(16000); // Sample rate
	setUint32(16000 * 2 * numOfChannels); // Byte rate
	setUint16(numOfChannels * 2); // Block align
	setUint16(16); // 16-bit
	setUint32(0x61746164); // "data"
	setUint32(length - pos - 4);
	
	for (let i = 0; i < audioBuffer.length; i++) {
		let sample = Math.max(-1, Math.min(1, channelData[i]));
		sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
		view.setInt16(pos, sample, true);
		pos += 2;
	}
	return new File([buffer], "audio.wav", { type: "audio/wav" });
}

export function VoiceSynthesizer() {
	const [text, setText] = useState("");
	const [promptText, setPromptText] = useState("");
	const [hfToken, setHfToken] = useState("");
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

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			setInfo("正在轉換音檔格式中，請稍候...");
			if (sampleUrl) {
				URL.revokeObjectURL(sampleUrl);
				setSampleUrl(null);
			}
			try {
				const wavFile = await convertToWav(selectedFile);
				setFile(wavFile);
				setSampleUrl(URL.createObjectURL(wavFile));
				setInfo("音檔格式已完美轉換為模型支援的 WAV！請點擊下方播放鈕確認是否有聲音。");
			} catch (err) {
				console.error(err);
				alert("無法處理此音檔，請嘗試上傳其他的音檔。");
			}
		}
	};

	const [lastGeneratedText, setLastGeneratedText] = useState("");
	const [audioUrls, setAudioUrls] = useState<string[]>([]);
	const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
	const [generationProgress, setGenerationProgress] = useState("");
	const audioRef = useRef<HTMLAudioElement>(null);

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || !promptText.trim() || !file) return;

		setIsGenerating(true);
		setError("");
		setInfo("");
		setGenerationProgress("");

		// 將完整故事依照標點符號與換行切割
		const rawSentences = text.split(/(?<=[。！？.!?])\s*|\n+/).filter(s => s.trim().length > 0);
		
		// 將句子組合成不超過 250 字的區塊 (F5-TTS 可以處理更長的文本，減少 API 請求次數)
		const chunks: string[] = [];
		let currentChunk = "";
		for (const sentence of rawSentences) {
			if (currentChunk.length + sentence.length > 250) {
				if (currentChunk) chunks.push(currentChunk);
				currentChunk = sentence;
			} else {
				currentChunk += sentence;
			}
		}
		if (currentChunk) chunks.push(currentChunk);

		let startIdx = 0;
		const existingUrls = [...audioUrls];

		// 如果文本沒有改變，且有部分已生成的音檔，則進入「接續生成」模式
		if (text === lastGeneratedText && audioUrls.length > 0 && audioUrls.length < chunks.length) {
			startIdx = audioUrls.length;
			setInfo(`接續生成：將從第 ${startIdx + 1} 段開始，為您省下伺服器配額！`);
		} else {
			// 清除舊的音檔並重新開始
			audioUrls.forEach(url => URL.revokeObjectURL(url));
			setAudioUrls([]);
			existingUrls.length = 0;
			setCurrentPlayIndex(0);
			setLastGeneratedText(text);
		}

		try {
			for (let i = startIdx; i < chunks.length; i++) {
				let success = false;
				let retryCount = 0;
				const maxRetries = 2;

				while (!success && retryCount <= maxRetries) {
					try {
						// 若為第二次以上的請求或重試，加上冷卻時間避免觸發免費限額
						if (i > 0 || retryCount > 0) {
							const waitTime = retryCount > 0 ? 30 : 10;
							setGenerationProgress(
								retryCount > 0 
									? `遇到伺服器限制，等待 ${waitTime} 秒後自動重試段落 ${i + 1}...` 
									: `為避免伺服器限額，冷卻 ${waitTime} 秒後繼續生成段落 ${i + 1}...`
							);
							await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
						}

						setGenerationProgress(`正在為您合成故事段落 ${i + 1} / ${chunks.length} ... (雲端排隊中請稍候)`);
						
						const formData = new FormData();
						formData.append("audio", file); // 這裡的 file 已經被強制轉換成乾淨的 WAV 了
						formData.append("story", chunks[i]);
						formData.append("promptText", promptText);
						if (hfToken.trim()) {
							formData.append("hfToken", hfToken.trim());
						}

						const res = await fetch("/api/clone-voice", {
							method: "POST",
							body: formData,
						});

						const data = await res.json();
						if (!res.ok) {
							throw new Error(data.error || data.message || `第 ${i + 1} 段語音合成失敗`);
						}

						if (data.audioBase64) {
							const blob = decodeBase64ToBlob(data.audioBase64, "audio/wav");
							const url = URL.createObjectURL(blob);
							existingUrls.push(url);
							// 即時更新畫面，讓第一段一出來就能開始聽！
							setAudioUrls([...existingUrls]);
							success = true;
						} else {
							throw new Error(data.message || "語音合成回傳異常");
						}
					} catch (chunkErr: any) {
						console.warn(`Chunk ${i + 1} failed:`, chunkErr);
						retryCount++;
						if (retryCount > maxRetries) {
							throw chunkErr; // 超過重試次數，直接拋出錯誤給外層
						}
					}
				}
			}
			setInfo("🎉 完整故事已經全部分段合成完畢！您可以開始聆聽了。");
			setGenerationProgress("");
		} catch (err: any) {
			console.error(err);
			setError(err?.message || "無法連線到語音服務，請稍後再試。");
			setGenerationProgress("部分生成已中斷，您可以先聆聽已完成的部分。");
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

			recorder.onstop = async () => {
				setInfo("錄音已完成，正在轉換格式，請稍候...");
				const blob = new Blob(chunks, {
					type: chunks[0]?.type || "audio/webm",
				});
				
				if (sampleUrl) {
					URL.revokeObjectURL(sampleUrl);
				}

				try {
					const wavFile = await convertToWav(blob);
					setFile(wavFile);
					setSampleUrl(URL.createObjectURL(wavFile));
					setInfo("錄音格式轉換已完成！請點擊下方播放鈕確認您的錄音是否有聲音。");
				} catch (err) {
					console.error("WAV conversion failed:", err);
					// Fallback if conversion fails
					const recordedFile = new File([blob], "recording.webm", {
						type: blob.type,
					});
					setFile(recordedFile);
					setSampleUrl(URL.createObjectURL(blob));
					setInfo("錄音完成（備用模式）。請確認是否有聲音。");
				}

				stream.getTracks().forEach((track) => {
					track.stop();
				});
				mediaStreamRef.current = null;
				mediaRecorderRef.current = null;
				setIsRecording(false);
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
			<div style={{ textAlign: "right", marginBottom: "-0.5rem" }}>
				<span style={{ 
					fontSize: "0.75rem", 
					background: "rgba(167, 139, 250, 0.2)", 
					color: "#c4b5fd", 
					padding: "0.2rem 0.6rem", 
					borderRadius: "1rem",
					border: "1px solid rgba(167, 139, 250, 0.3)" 
				}}>
					⚡ Powered by F5-TTS AI Engine
				</span>
			</div>
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

				<input
					type="password"
					placeholder="Hugging Face Token (選填，用於解除免費限額，如遇到 ZeroGPU 錯誤請申請一組填入)"
					value={hfToken}
					onChange={(e) => setHfToken(e.target.value)}
					disabled={isGenerating}
					style={{
						width: "100%",
						boxSizing: "border-box",
						padding: "0.8rem",
						borderRadius: "var(--radius-sm)",
						border: "1px solid rgba(255,255,255,0.1)",
						background: "rgba(15, 23, 42, 0.4)",
						color: "#fff",
						fontSize: "0.9rem"
					}}
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

			{generationProgress && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					style={{ color: "#fde047", fontSize: "0.95rem", marginTop: "0.5rem" }}
					role="status"
					aria-live="polite"
				>
					{generationProgress}
				</motion.div>
			)}

			{audioUrls.length > 0 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
				>
					<p style={{ color: "#e2e8f0", margin: 0, fontSize: "0.9rem" }}>
						🎵 播放進度：第 {currentPlayIndex + 1} / {audioUrls.length} 段
					</p>
					<audio
						ref={audioRef}
						controls
						autoPlay
						src={audioUrls[currentPlayIndex]}
						onEnded={() => {
							if (currentPlayIndex < audioUrls.length - 1) {
								setCurrentPlayIndex(prev => prev + 1);
							}
						}}
						style={{ width: "100%", outline: "none" }}
					/>
					<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
						{audioUrls.map((_, idx) => (
							<button
								key={idx}
								onClick={() => setCurrentPlayIndex(idx)}
								style={{
									padding: "0.2rem 0.6rem",
									borderRadius: "1rem",
									border: "none",
									fontSize: "0.8rem",
									cursor: "pointer",
									background: currentPlayIndex === idx ? "#a78bfa" : "#334155",
									color: currentPlayIndex === idx ? "#ffffff" : "#cbd5e1"
								}}
							>
								{idx + 1}
							</button>
						))}
					</div>
				</motion.div>
			)}
		</div>
	);
}
