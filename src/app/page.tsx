import ChatUI from "./ChatUI";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Link from "next/link";

/**
 * Root page — Server Component.
 *
 * No "use client" here. The static shell (header, layout) is rendered at
 * build time. The interactive chat widget is a separate client boundary
 * in ChatUI.tsx, which limits the client JS bundle to only what React hooks
 * actually need.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-6 font-sans text-[var(--foreground)] transition-colors duration-300">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="rounded-theme flex flex-col gap-4 border-theme border-color-theme bg-[var(--background)] p-4 shadow-theme transition-all duration-300">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold">Claude Chat</h1>
              <p className="text-sm opacity-70">
                Math questions are forced through the calculator tool.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/sandbox"
                className="rounded-theme border-theme border-color-theme bg-transparent px-4 py-2 text-sm font-medium shadow-theme transition-all active:scale-95 whitespace-nowrap hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Token Sandbox
              </Link>
              <Link
                href="/book"
                className="rounded-theme bg-accent-theme px-4 py-2 text-sm font-medium shadow-theme transition-transform active:scale-95 whitespace-nowrap"
              >
                Read the Book
              </Link>
            </div>
          </div>
          <ThemeSwitcher />
        </header>

        <ChatUI />
      </main>
    </div>
  );
}
