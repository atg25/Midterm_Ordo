import React from "react";
import type { PresentedMessage } from "../../adapters/ChatPresenter";
import { RichContentRenderer } from "./RichContentRenderer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { BlockNode, InlineNode, RichContent } from "@/core/entities/rich-content";

interface MessageListProps {
  messages: PresentedMessage[];
  isSending: boolean;
  dynamicSuggestions: string[];
  isHeroState?: boolean;
  onSuggestionClick: (text: string) => void;
  onLinkClick: (slug: string) => void;
  searchQuery: string;
  isEmbedded?: boolean;
}

const BrandHeader = ({ isEmbedded = false }: { isEmbedded?: boolean }) => (
    <div className={`flex flex-col items-center justify-center px-3 text-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out fill-mode-both sm:px-4 ${isEmbedded ? "pb-(--hero-intro-stack-gap) space-y-(--phi-1)" : "pt-(--phi-2) pb-(--hero-intro-stack-gap) space-y-(--phi-1)"}`}>
    <div className="theme-label tier-micro inline-flex items-center gap-(--hero-badge-gap) rounded-full bg-accent/5 px-(--phi-1) py-(--phi-3) font-medium text-accent/70">
      <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
      Studio Ordo Intelligence
    </div>

    <h1 className="theme-display max-w-[24ch] text-[clamp(1.4rem,3.2vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground/90 balance">
      Architecture, retrieval, and execution planning in one thread.
    </h1>
  </div>
);

function extractInlineText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "bold":
        case "code-inline":
          return node.text;
        case "library-link":
          return node.slug.replace(/-/g, " ");
        default:
          return "";
      }
    })
    .join(" ");
}

function extractBlockText(block: BlockNode): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "blockquote":
      return extractInlineText(block.content);
    case "list":
      return block.items.map((item) => extractInlineText(item)).join(" ");
    case "table":
      return [
        ...(block.header ?? []).map((cell) => extractInlineText(cell)),
        ...block.rows.flat().map((cell) => extractInlineText(cell)),
      ].join(" ");
    case "audio":
      return `${block.title} ${block.text}`;
    case "web-search":
      return `${block.query} ${(block.allowed_domains ?? []).join(" ")}`;
    case "code-block":
      return block.code;
    case "divider":
      return "";
    default:
      return "";
  }
}

function extractRichContentText(content: RichContent): string {
  return content.blocks.map((block) => extractBlockText(block)).join(" ").trim();
}

export const MessageList: React.FC<MessageListProps> = React.memo(({
  messages,
  isSending,
  dynamicSuggestions,
  isHeroState = false,
  onSuggestionClick,
  onLinkClick,
  searchQuery,
  isEmbedded = false,
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMessages = normalizedQuery
    ? messages.filter((m) =>
        `${m.rawContent} ${extractRichContentText(m.content)}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : messages;

  const firstMessageId = messages[0]?.id;
  const lastMessageId = messages[messages.length - 1]?.id;
  const lastVisibleMessageId = filteredMessages[filteredMessages.length - 1]?.id;
  const lastAssistantMessageId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;
  const hasVisibleSuggestionChips =
    !isSending &&
    dynamicSuggestions.length > 0 &&
    lastAssistantMessageId != null &&
    lastAssistantMessageId === lastVisibleMessageId;

  if (filteredMessages.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
        <p className="text-sm font-medium">
          No messages found matching &ldquo;{searchQuery}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col`}
      data-message-list-mode={isEmbedded ? "embedded" : "floating"}
      data-message-list-state={isHeroState ? "hero" : "conversation"}
      data-chat-fold-buffer={isEmbedded ? "true" : undefined}
      style={{
        gap: "var(--message-gap)",
        paddingTop: isHeroState ? "clamp(1.5rem, 8vh, 4.5rem)" : undefined,
        paddingBottom: isEmbedded
          ? isHeroState
            ? "var(--hero-composer-offset)"
            : `calc(var(--chat-fold-gutter) + var(--chat-composer-gap) + ${hasVisibleSuggestionChips ? "var(--chat-suggestion-stack-clearance)" : "0px"})`
          : "2rem",
      }}
    >
      {messages.length === 1 && !searchQuery && <BrandHeader isEmbedded={isEmbedded} />}

      {filteredMessages.map((message) => (
        <div key={message.id} className="flex flex-col gap-(--phi-1) animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out fill-mode-both">
          {message.role === "user" ? (
            <UserBubble content={message} />
          ) : (
            <AssistantBubble
              message={message}
              isStreaming={isSending && message.id === lastMessageId}
              onLinkClick={onLinkClick}
              isInitialGreeting={message.id === firstMessageId}
            />
          )}

          {message.role === "assistant" &&
            !isSending &&
            message.id === lastAssistantMessageId &&
            message.id === lastVisibleMessageId &&
            dynamicSuggestions.length > 0 && (
              <div className={`${isHeroState ? "mt-(--phi-2) flex justify-center pb-(--phi-1)" : "mt-(--phi-1) max-w-[min(44rem,calc(100%-var(--phi-2p)))] pb-(--phi-1)"} animate-in fade-in slide-in-from-bottom-2 duration-500`} style={isHeroState ? undefined : { marginInlineStart: 'var(--chat-message-inline-offset)' }}>
                <SuggestionChips
                  suggestions={dynamicSuggestions}
                  onSend={onSuggestionClick}
                  centered={isHeroState}
                />
              </div>
            )}
        </div>
      ))}

      {isSending && lastVisibleMessageId === lastMessageId && messages[messages.length - 1]?.role === "user" && (
        <TypingIndicator />
      )}
    </div>
  );
});

MessageList.displayName = "MessageList";

const UserBubble = React.memo<{ content: PresentedMessage }>(({ content }) => {
  return (
    <div className="flex w-full flex-col items-end gap-(--chat-meta-gap) px-1 sm:px-2 md:px-0">
      <div className="theme-label tier-micro pe-(--chat-bubble-padding-inline) font-medium text-foreground/28">
        <span>You</span>
        {content.timestamp ? <span className="ms-(--phi-2) tabular-nums text-foreground/22">{content.timestamp}</span> : null}
      </div>
      <div className="relative theme-body tier-body max-w-[92%] rounded-[calc(var(--chat-suggestion-frame-radius)-var(--phi-2))] rounded-br-[calc(var(--phi-1p)+var(--phi-2))] rounded-tr-[calc(var(--phi-1p)+var(--phi-3))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--accent)_7%,var(--surface))_0%,color-mix(in_oklab,var(--accent)_4%,var(--surface))_100%)] px-(--chat-bubble-padding-inline) py-(--chat-bubble-padding-block) text-foreground shadow-[0_12px_24px_-24px_color-mix(in_srgb,var(--shadow-base)_9%,transparent)] sm:max-w-[74%]">
        <ErrorBoundary name="UserBubble">
          <RichContentRenderer content={content.content} />
          {content.attachments.length > 0 && (
            <div className={`${content.rawContent ? "mt-3" : ""} flex flex-col gap-2`}>
              {content.attachments.map((attachment) => (
                <a
                  key={attachment.assetId}
                  href={`/api/user-files/${attachment.assetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-accent/12 bg-background/70 px-3 py-2.5 text-left transition-colors hover:bg-background"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/45">
                      Attachment
                    </span>
                    <span className="block truncate text-sm font-medium normal-case tracking-normal text-foreground">
                      {attachment.fileName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-foreground/55">
                    {Math.max(1, Math.round(attachment.fileSize / 1024))} KB
                  </span>
                </a>
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
});

UserBubble.displayName = "UserBubble";

const AssistantBubble = React.memo<{
  message: PresentedMessage;
  isStreaming: boolean;
  onLinkClick: (slug: string) => void;
  isInitialGreeting?: boolean;
}>(({ message, isStreaming, onLinkClick, isInitialGreeting }) => {
  const [displayText, setDisplayText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(!!isInitialGreeting);
  
  React.useEffect(() => {
    if (!isInitialGreeting) return;
    let current = "";
    let index = 0;
    const speed = 10;
    const fullText = message.rawContent || "";

    const interval = setInterval(() => {
      if (index < fullText.length) {
        current += fullText[index];
        setDisplayText(current);
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [message.rawContent, isInitialGreeting]);

  return (
    <div className="group flex w-full items-start justify-start gap-(--phi-1) px-1 transition-all duration-300 sm:gap-(--phi-1p) sm:px-2 md:px-0">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_8px_20px_-20px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)]">
        <img src="/ordo-avatar.png" alt="" width={24} height={24} className="h-full w-full object-cover" />
      </div>

      <div className={`flex w-full max-w-[95%] flex-col gap-(--chat-meta-gap) sm:max-w-[86%] ${isInitialGreeting ? "pt-1" : ""}`}>
        <div className="flex items-center gap-(--phi-2) ps-(--phi-2)">
          <span className="theme-label tier-micro font-medium text-foreground/30">
            Studio Ordo
          </span>
          {message.timestamp ? (
            <span className="theme-label tier-micro font-medium tabular-nums text-foreground/18">
              {message.timestamp}
            </span>
          ) : null}
        </div>
        <div className="theme-body tier-body relative overflow-hidden rounded-[calc(var(--chat-suggestion-frame-radius)-var(--phi-2))] rounded-bl-[calc(var(--phi-1p)+var(--phi-2))] rounded-tl-[calc(var(--phi-1p)+var(--phi-3))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_99%,var(--background))_0%,color-mix(in_oklab,var(--surface)_96%,var(--background))_100%)] px-(--chat-bubble-padding-inline) py-[calc(var(--chat-bubble-padding-block)+var(--phi-2))] text-foreground/80 shadow-[0_14px_28px_-26px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)]">
          <div className="pointer-events-none absolute inset-y-[calc(var(--chat-bubble-padding-block)+var(--phi-3))] left-(--chat-bubble-padding-inline) w-px rounded-full bg-linear-to-b from-transparent via-foreground/6 to-transparent" aria-hidden="true" />
          <ErrorBoundary name="AssistantBubble">
            {isInitialGreeting ? (
              <div className="relative ps-(--phi-1)">
                <div className="invisible pointer-events-none" aria-hidden="true">
                  <RichContentRenderer content={message.content} />
                </div>
                <div className="absolute inset-x-0 top-0">
                  {isTyping ? (
                    <div className="inline whitespace-pre-wrap">
                      {displayText}
                      <span className="inline-block w-1.5 h-4 ms-1 bg-accent animate-pulse align-middle" />
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-500">
                      <RichContentRenderer content={message.content} onLinkClick={onLinkClick} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ps-(--phi-1)">
                <RichContentRenderer
                  content={message.content}
                  onLinkClick={onLinkClick}
                />
              </div>
            )}
          </ErrorBoundary>

          {isStreaming && !isInitialGreeting && (
            <span className="inline-block w-1 h-3.5 bg-accent animate-pulse align-middle ms-1 rounded-sm relative -top-0.5" />
          )}
        </div>
      </div>
    </div>
  );
});

AssistantBubble.displayName = "AssistantBubble";

const TypingIndicator = () => (
  <div className="mt-(--phi-1) flex items-center justify-start gap-2.5 ms-[calc(var(--chat-avatar-size)+var(--phi-1p))]">
    <div className="flex items-center gap-1.5 px-(--phi-1) py-(--phi-2)">
      <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce [animation-delay:120ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 animate-bounce [animation-delay:240ms]" />
    </div>
  </div>
);

const SuggestionChips: React.FC<{
  suggestions: string[];
  onSend: (text: string) => void;
  centered?: boolean;
}> = ({ suggestions, onSend, centered = false }) => (
  <div className={`flex flex-col gap-(--phi-2) ${centered ? "items-center" : "items-start"}`}>
    <p className={`theme-label tier-micro font-medium text-foreground/22 ${centered ? "text-center" : "ps-(--phi-1)"}`}>
      Next
    </p>
    <div className={`w-full rounded-(--chat-suggestion-frame-radius) ${centered ? "max-w-[calc(var(--hero-greeting-max-width)+4rem)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_58%,transparent)_0%,color-mix(in_oklab,var(--surface)_30%,transparent)_100%)] shadow-[0_16px_30px_-34px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)]" : "max-w-[min(42rem,100%)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_32%,transparent)_0%,color-mix(in_oklab,var(--surface)_10%,transparent)_100%)] shadow-[0_12px_24px_-30px_color-mix(in_srgb,var(--shadow-base)_6%,transparent)]"}`} style={{ paddingInline: 'var(--chat-suggestion-frame-padding-inline)', paddingBlock: 'var(--chat-suggestion-frame-padding-block)' }}>
      <div className={`flex flex-wrap gap-(--hero-chip-cluster-gap) ${centered ? "justify-center" : "justify-start"}`} style={{ paddingInline: 'var(--chat-suggestion-frame-inner-padding)' }}>
      {suggestions.map((s, i) => (
        <button
          key={s}
          onClick={() => onSend(s)}
          style={{ animationDelay: `${i * 100}ms` }}
          className={`group theme-body tier-body relative inline-flex min-h-10 items-center justify-center gap-(--phi-2) overflow-hidden rounded-full bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_97%,var(--background))_0%,color-mix(in_oklab,var(--surface-muted)_66%,transparent)_100%)] px-(--phi-0) py-(--phi-1) font-medium tracking-[-0.012em] text-foreground/60 shadow-[0_8px_18px_-18px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)] transition-all duration-200 hover:-translate-y-px hover:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--accent)_4%,var(--surface))_0%,color-mix(in_oklab,var(--accent)_8%,var(--surface))_100%)] hover:text-foreground hover:shadow-[0_14px_24px_-20px_color-mix(in_srgb,var(--shadow-base)_10%,transparent)] active:translate-y-0 active:scale-[0.995] animate-in fade-in slide-in-from-bottom-2 fill-mode-both focus-ring ${centered ? "sm:px-(--phi-1p) sm:py-[0.72rem]" : "sm:px-(--phi-0) sm:py-(--phi-1)"}`}
        >
          <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/40 text-[0.66rem] text-foreground/22 transition-all group-hover:translate-x-px group-hover:text-accent/60">
            ↗
          </span>
          <span className="relative">{s}</span>
        </button>
      ))}
      </div>
    </div>
  </div>
);
