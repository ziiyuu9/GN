"use client";

import { type HTMLMotionProps, motion } from "framer-motion";
import type React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
	children: React.ReactNode;
	className?: string;
}

export function GlassCard({
	children,
	className = "",
	...props
}: GlassCardProps) {
	return (
		<motion.div
			className={`glass-panel ${className}`}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			whileHover={{ y: -5, boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)" }}
			{...props}
		>
			{children}
		</motion.div>
	);
}
