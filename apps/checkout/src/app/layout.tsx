import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Checkout — Revstack",
  description: "Secure checkout powered by Revstack",
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/favicon-dark.png" },
      { media: "(prefers-color-scheme: dark)", url: "/favicon-light.png" },
    ],
    shortcut: [
      { media: "(prefers-color-scheme: light)", url: "/favicon-dark.png" },
      { media: "(prefers-color-scheme: dark)", url: "/favicon-light.png" },
    ],
    apple: [
      { media: "(prefers-color-scheme: light)", url: "/favicon-dark.png" },
      { media: "(prefers-color-scheme: dark)", url: "/favicon-light.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased min-w-screen overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
