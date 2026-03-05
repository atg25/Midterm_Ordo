"use client";

import type { FormEvent } from "react";
import { useChatStream } from "@/hooks/useChatStream";

/**
 * ChatUI — client component boundary.
 *
 * Isolated here so that page.tsx (the root layout entry) remains a Server
 * Component. This reduces the initial JS payload: only this subtree ships
 * client-side React runtime hooks. Everything outside this component can be
 * statically rendered at build time with no client JS.
 *
 * This pattern is enforced by the Lighthouse audit and the
 * `unused-javascript` signal: keeping client boundaries narrow is the
 * primary lever for reducing unused JS in Next.js App Router apps.
 */
export default function ChatUI() {
  const { messages, input, isSending, canSend, setInput, sendMessage } =
    useChatStream();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    await sendMessage(event);
  }

  return (
    <section className="rounded-theme border-theme border-color-theme bg-[var(--background)] p-4 shadow-theme transition-all duration-300">
      <div className="mb-4 flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm opacity-70">
            Ask anything. For arithmetic, the assistant must use the calculator
            tool.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className="rounded-theme border-theme border-color-theme p-3 text-sm shadow-theme transition-all"
            >
              <p className="mb-1 text-xs uppercase tracking-wide opacity-50">
                {message.role}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message"
          aria-label="Message"
          className="flex-1 rounded-theme border-theme border-color-theme bg-transparent px-3 py-2 text-sm outline-none transition-all focus:border-[--accent-color] focus:ring-1 focus:ring-[--accent-color]"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-disabled={!canSend}
          className="rounded-theme bg-accent-theme px-4 py-2 text-sm font-medium shadow-theme transition-transform disabled:opacity-50 active:scale-95"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
