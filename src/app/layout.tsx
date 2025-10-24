import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://todoish.vercel.app"), // Update with your actual domain
  title: {
    default: "todoish - AI-powered task management",
    template: "%s | todoish",
  },
  description: "Smart todo app with AI-powered task extraction, natural language queries, and intelligent scheduling. Just ramble, and let AI organize your tasks.",
  keywords: ["todo", "task management", "AI", "productivity", "natural language", "smart todos", "task assistant"],
  authors: [{ name: "todoish" }],
  creator: "todoish",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://todoish.vercel.app",
    title: "todoish - AI-powered task management",
    description: "Just ramble, and let AI organize your tasks. Smart todo app with natural language processing.",
    siteName: "todoish",
    images: [
      {
        url: "/og-image.png", // We'll create this
        width: 1200,
        height: 630,
        alt: "todoish - AI-powered task management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "todoish - AI-powered task management",
    description: "Just ramble, and let AI organize your tasks. Smart todo app with natural language processing.",
    images: ["/og-image.png"],
    creator: "@todoish", // Update with actual Twitter handle if you have one
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
