import React, { useEffect, useRef } from "react";
import MentionsMenu from "@/components/MentionsMenu";
import type { MentionItem } from "@/core/entities/mentions";

interface ChatInputProps {
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string, selectionStart: number) => void;
  onSend: () => void;
  isSending: boolean;
  canSend: boolean;
  onArrowUp: () => void;

  // Mentions
  activeTrigger: string | null;
  suggestions: MentionItem[];
  mentionIndex: number;
  onMentionIndexChange: (index: number) => void;
  onSuggestionSelect: (item: MentionItem) => void;

  // Files
  pendingFiles: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputRef,
  value,
  onChange,
  onSend,
  isSending,
  canSend,
  onArrowUp,
  activeTrigger,
  suggestions,
  mentionIndex,
  onMentionIndexChange,
  onSuggestionSelect,
  pendingFiles,
  onFileSelect,
  onFileRemove,
}) => {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = inputRef ?? internalTextareaRef;
  const hasInput = value.trim().length > 0;

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    const nextHeight = Math.min(element.scrollHeight, 224);
    element.style.height = `${Math.max(nextHeight, 44)}px`;
    element.style.overflowY = element.scrollHeight > 224 ? "auto" : "hidden";
  }, [textareaRef, value]);

  const handleMentionsNavigation = (e: React.KeyboardEvent): boolean => {
    if (!activeTrigger || suggestions.length === 0) return false;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      onMentionIndexChange((mentionIndex + 1) % suggestions.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onMentionIndexChange(
        (mentionIndex - 1 + suggestions.length) % suggestions.length,
      );
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const item = suggestions[mentionIndex];
      if (item) onSuggestionSelect(item);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onChange(value, 0);
      return true;
    }
    return false;
  };

  const handleMessageSubmit = (e: React.KeyboardEvent): boolean => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
      return true;
    }
    return false;
  };

  const handleEditLastMessage = (e: React.KeyboardEvent): boolean => {
    if (e.key === "ArrowUp" && value === "" && !isSending) {
      e.preventDefault();
      onArrowUp();
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (handleMentionsNavigation(e)) return;
    if (handleMessageSubmit(e)) return;
    handleEditLastMessage(e);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* File Previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pendingFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border-theme rounded-lg text-xs font-medium"
            >
              <span className="max-w-30 truncate">{file.name}</span>
              <button
                onClick={() => onFileRemove(i)}
                className="hover:text-red-500 p-0.5"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
            className="relative flex min-h-(--chat-composer-min-height) items-end gap-(--phi-1) overflow-hidden rounded-(--chat-composer-radius) border border-foreground/8 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_99%,var(--background))_0%,color-mix(in_oklab,var(--surface)_95%,var(--background))_50%,color-mix(in_oklab,var(--surface)_93%,var(--background))_100%)] shadow-[0_18px_36px_-32px_color-mix(in_srgb,var(--shadow-base)_8%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_6%,transparent)] transition-all duration-500 focus-within:border-foreground/14 focus-within:shadow-[0_24px_44px_-30px_color-mix(in_srgb,var(--shadow-base)_12%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_8%,transparent)] hover:border-foreground/11 hover:shadow-[0_20px_38px_-32px_color-mix(in_srgb,var(--shadow-base)_10%,transparent)]"
        style={{ padding: 'var(--input-padding)' }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--highlight-base)_45%,transparent),transparent_60%)] opacity-70" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-(--phi-1p) bottom-0 h-12 bg-linear-to-t from-accent/4 to-transparent opacity-60" />
        {activeTrigger && suggestions.length > 0 && (
          <MentionsMenu
            suggestions={suggestions}
            activeIndex={mentionIndex}
            onSelect={onSuggestionSelect}
          />
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
          multiple
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
                className="focus-ring min-h-11 min-w-11 shrink-0 rounded-full bg-transparent p-(--phi-2) text-foreground/24 transition-all hover:text-foreground/48 active:scale-95"
          aria-label="Attach file"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <div className="relative flex min-h-11 flex-1 items-center self-stretch rounded-[calc(var(--chat-composer-radius)-var(--phi-1))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_78%,var(--surface))_0%,color-mix(in_oklab,var(--background)_90%,var(--surface-muted))_100%)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_72%,transparent),inset_0_-1px_0_color-mix(in_srgb,var(--shadow-base)_3%,transparent),0_1px_2px_color-mix(in_srgb,var(--shadow-base)_3%,transparent)] transition-shadow duration-300 focus-within:shadow-[inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_82%,transparent),inset_0_-1px_0_color-mix(in_srgb,var(--shadow-base)_4%,transparent),0_0_0_1.5px_color-mix(in_oklab,var(--accent)_14%,transparent),0_2px_8px_-4px_color-mix(in_oklab,var(--accent)_10%,transparent)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-(--chat-bubble-padding-inline) top-0 h-px bg-linear-to-r from-transparent via-foreground/10 to-transparent" />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value, e.target.selectionStart ?? 0)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
                  className="theme-body tier-body max-h-56 min-h-11 flex-1 resize-none overflow-y-auto bg-transparent px-(--chat-bubble-padding-inline) py-(--chat-bubble-padding-block) font-normal text-foreground outline-none placeholder:text-foreground/40"
          />
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className={[
            "focus-ring theme-label tier-micro flex min-h-10 shrink-0 items-center gap-2 rounded-full px-(--chat-composer-button-padding-inline) py-(--chat-composer-button-padding-block) font-semibold transition-all duration-300 hover:-translate-y-px active:translate-y-0 active:scale-95",
            hasInput
              ? "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--foreground)_64%,var(--accent))_0%,color-mix(in_oklab,var(--foreground)_86%,var(--accent))_100%)] text-background shadow-[0_14px_22px_-14px_color-mix(in_srgb,var(--shadow-base)_22%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_18%,transparent)] hover:shadow-[0_18px_26px_-14px_color-mix(in_srgb,var(--shadow-base)_26%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--highlight-base)_22%,transparent)]"
              : "bg-transparent text-foreground/20 shadow-none hover:text-foreground/32",
            !canSend && !hasInput ? "opacity-100" : "",
            !canSend && hasInput ? "disabled:bg-[color-mix(in_oklab,var(--surface-muted)_92%,var(--background))] disabled:text-foreground/42 disabled:shadow-none" : "",
          ].join(" ")}
        >
          {isSending ? (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
            </span>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
};
