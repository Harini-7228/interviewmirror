import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "InterviewMirror — AI Interviewer That Remembers Where You Struggle",
  description:
    "An adaptive technical interviewer powered by open-weight AI. Practice interviews, detect weaknesses, and improve every session.",
  keywords: ["technical interview", "AI interview practice", "Gemma", "interview prep", "DSA", "Java", "SQL"],
  openGraph: {
    title: "InterviewMirror",
    description: "An AI interviewer that remembers where you struggle.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
