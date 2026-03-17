import type { Metadata } from "next";
import {
  Archivo,
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  League_Spartan,
  Space_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

import { ThemeProvider } from "@/components/ThemeProvider";
import { GridInspector } from "@/components/GridInspector";
import { AppShell } from "@/components/AppShell";
import CommandPalette from "@/components/CommandPalette";
import { GlobalChat } from "@/components/GlobalChat";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Systems Console",
  description: "Next.js Architectural Playground",
};

import { ChatProvider } from "@/hooks/useGlobalChat";
import { Suspense } from "react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${leagueSpartan.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${fraunces.variable} ${spaceMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ChatProvider>
            <AppShell user={user}>{children}</AppShell>
            <Suspense fallback={null}>
              <GlobalChat />
            </Suspense>
            <GridInspector />
            <CommandPalette />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
