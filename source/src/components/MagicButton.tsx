"use client";

import { type HTMLMotionProps, motion } from "framer-motion";
import type React from "react";

interface MagicButtonProps extends HTMLMotionProps<"button"> {
	children: React.ReactNode;
	className?: string;
	variant?: "primary" | "secondary";
}

export function MagicButton({
	children,
	className = "",
	variant = "primary",
	...props
}: MagicButtonProps) {
	const gradient =
		variant === "primary"
			? "linear-gradient(135deg, #8b5cf6, #ec4899)"
			: "linear-gradient(135deg, #3b82f6, #8b5cf6)";

	return (
		<motion.button
			className={`primary ${className}`}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 400, damping: 10 }}
			style={{
				background: gradient,
				position: "relative",
				overflow: "hidden",
				...props.style,
			}}
			{...props}
		>
			<span style={{ position: "relative", zIndex: 1 }}>{children}</span>
			<motion.div
				className="magic-glow"
				initial={{ x: "-100%" }}
				whileHover={{ x: "100%" }}
				transition={{ duration: 0.6, ease: "easeInOut" }}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					background:
						"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
					zIndex: 0,
				}}
			/>
		</motion.button>
	);
}
