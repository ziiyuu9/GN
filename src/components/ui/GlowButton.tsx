"use client";

import { type HTMLMotionProps, motion } from "framer-motion";
import type React from "react";

interface GlowButtonProps extends HTMLMotionProps<"button"> {
	children: React.ReactNode;
	className?: string;
}

export function GlowButton({
	children,
	className = "",
	...props
}: GlowButtonProps) {
	return (
		<motion.button
			className={`primary ${className}`}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 400, damping: 10 }}
			{...props}
		>
			{children}
		</motion.button>
	);
}
