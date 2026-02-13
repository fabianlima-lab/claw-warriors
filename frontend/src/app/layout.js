import { Cinzel, DM_Sans } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "ClawWarriors — Your AI Warrior, Your Rules",
  description:
    "Deploy personalized AI agents to Telegram and WhatsApp. Pick a warrior, connect your channel, start chatting — all in under 5 minutes.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#08090E",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
