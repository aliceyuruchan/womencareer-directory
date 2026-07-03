import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Womencareer.cn",
  description: "面向全球女性职业发展的精选资源目录。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
