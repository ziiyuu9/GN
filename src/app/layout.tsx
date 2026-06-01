import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "咕奈 GoodNight",
	description: "新世代 AI 說故事與語音陪伴系統",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh-TW">
			<body>{children}</body>
		</html>
	);
}
