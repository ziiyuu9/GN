"use client";

import { motion } from "framer-motion";
import type React from "react";
import { GlassCard } from "./ui/GlassCard";

interface StoryCardProps {
	title: string;
	description: string;
	children: React.ReactNode;
	delay?: number;
}

export function StoryCard({
	title,
	description,
	children,
	delay = 0,
}: StoryCardProps) {
	return (
		<GlassCard
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay, ease: "easeOut" }}
			style={{ minWidth: "300px", maxWidth: "600px", flex: "1 1 400px" }}
		>
			<motion.h2
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.2 }}
				style={{ marginBottom: "1rem", color: "var(--foreground)" }}
			>
				{title}
			</motion.h2>
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.3 }}
				style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: "1.6" }}
			>
				{description}
			</motion.p>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: delay + 0.4 }}
			>
				{children}
			</motion.div>
		</GlassCard>
	);
}
