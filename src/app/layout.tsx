import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { Shell } from "@/components/shell";
import { siteUrl } from "@/lib/games";
import "./globals.css";
import "./games.css";
import "./bonus-games.css";
import "./festival-games.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Game World | A Little Play. A Better Day.", template: "%s | Game World" },
  description: "Your happy place for free online games. Play Snake, Sudoku, chess, Ludo, puzzles, and learning games. No downloads. Just play.",
  openGraph: { type: "website", siteName: "Game World", title: "Game World | A Little Play. A Better Day.", description: "Free games. Endless little adventures." },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`} suppressHydrationWarning>
      <body><a className="skip-link" href="#main">Skip to content</a><Shell>{children}</Shell></body>
    </html>
  );
}
