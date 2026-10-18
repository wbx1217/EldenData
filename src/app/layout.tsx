import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "交界地抗性档案 · Elden Ring 敌人抗性资料库",
  description:
    "785 个《艾尔登法环》敌人的伤害承受倍率、异常抵抗、韧性与特性，按势力与区域归档，支持弱点、免疫与特性筛选。",
  applicationName: "交界地抗性档案",
  authors: [{ name: "The Lands Between Archive" }],
  keywords: ["艾尔登法环", "Elden Ring", "敌人抗性", "DLC", "数据档案"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
