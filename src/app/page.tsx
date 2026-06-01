"use client";

import { motion } from "framer-motion";
import React from "react";
import { StoryCard } from "@/components/StoryCard";
import { StoryGenerator } from "@/components/StoryGenerator";
import { VoiceSynthesizer } from "@/components/VoiceSynthesizer";

export default function Home() {
	return (
		<main className="container text-center">
			<motion.div
				className="mb-8"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: "easeOut" }}
			>
				<motion.h1
					initial={{ scale: 0.92 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
				>
					咕奈 GoodNight
				</motion.h1>
				<motion.p
					className="subtitle"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					私人化 AI 床邊故事與語音陪伴系統，支援本地 Ollama 與 TTS 服務。
				</motion.p>
			</motion.div>

			<div className="card-grid">
				<StoryCard
					title="生成床邊故事"
					description="整合本地 Ollama；用最少延遲生成適合睡前閱讀的沉浸式故事。"
					delay={0.1}
				>
					<StoryGenerator />
				</StoryCard>

				<StoryCard
					title="克隆語音合成"
					description="上傳聲音樣本並生成自訂朗讀語音，為故事增添專屬陪伴效果。"
					delay={0.3}
				>
					<VoiceSynthesizer />
				</StoryCard>
			</div>
		</main>
	);
}
