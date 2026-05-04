import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_JP } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI知識 Discord 学習アプリ",
  description: "AIに関する知識問題を登録し、Discordで毎日復習できる学習支援アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJp.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_42%,_#eef4f8_100%)]">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
