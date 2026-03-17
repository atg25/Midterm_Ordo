import React from "react";

interface HomepageChatStageProps {
  children: React.ReactNode;
}

export function HomepageChatStage({ children }: HomepageChatStageProps) {
  return (
    <section
      className="homepage-chat-atmosphere relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
      data-homepage-chat-stage="true"
      data-homepage-stage-behavior="bounded"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--highlight-base)_85%,transparent),transparent_72%)] opacity-90" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[-10rem] top-28 h-80 w-80 rounded-full bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-40 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] blur-3xl" />
      <div
        className="site-container relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
        data-homepage-chat-stage-shell="true"
      >
        {children}
      </div>
    </section>
  );
}