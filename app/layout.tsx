import type { Metadata } from "next";
import { Chakra_Petch, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Game Ghor — Book your slot",
  description:
    "Book a Mobile, PS4, or PS5 slot at Game Ghor gaming cafe. No account needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-bg text-text">
        <Header />
        <div className="max-w-[430px] mx-auto min-h-screen relative pb-24 md:max-w-6xl md:pb-16 md:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
