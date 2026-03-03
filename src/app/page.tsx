import ChatUI from "./ChatUI";

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
    <div className="min-h-screen bg-zinc-50 p-6 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-xl font-semibold">Claude Chat</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Math questions are forced through the calculator tool.
          </p>
        </header>

        <ChatUI />
      </main>
    </div>
  );
}
