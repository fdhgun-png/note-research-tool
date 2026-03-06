import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "note透視くん - noteクリエイターの競合分析ダッシュボード",
  description:
    "noteクリエイターのURLを入力するだけで、スキ数・投稿頻度・価格帯・キーワードをデータで可視化。競合の戦略が丸見えに。",
  openGraph: {
    title: "note透視くん - noteクリエイターの競合分析ダッシュボード",
    description:
      "noteクリエイターのURLを入力するだけで、スキ数・投稿頻度・価格帯・キーワードをデータで可視化。競合の戦略が丸見えに。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "note透視くん - noteクリエイターの競合分析ダッシュボード",
    description:
      "noteクリエイターのURLを入力するだけで、スキ数・投稿頻度・価格帯・キーワードをデータで可視化。競合の戦略が丸見えに。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
