import React from "react";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  isFloating: boolean;
  onMinimize?: () => void;
  onFullScreenToggle: () => void;
  isFullScreen: boolean;

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Density
  density: "compact" | "normal" | "relaxed";
  onDensityChange: (density: "compact" | "normal" | "relaxed") => void;

  // Grid
  gridEnabled: boolean;
  onGridToggle: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  isFloating,
  onMinimize,
  onFullScreenToggle,
  isFullScreen,
  searchQuery,
  onSearchChange,
  density,
  onDensityChange,
  gridEnabled,
  onGridToggle,
}) => {
  const floatingHeaderClasses = isFullScreen
    ? "glass-surface safe-area-pt safe-area-px relative z-10 flex shrink-0 items-center justify-between border-b border-color-theme pb-4 pt-3 shadow-[0_10px_30px_color-mix(in_srgb,var(--shadow-base)_10%,transparent)] transition-colors duration-500"
    : "glass-surface relative z-10 flex shrink-0 items-center justify-between border-b border-color-theme px-(--container-padding) py-4 shadow-[0_10px_30px_color-mix(in_srgb,var(--shadow-base)_10%,transparent)] transition-colors duration-500";

  if (isFloating) {
    return (
      <div className={floatingHeaderClasses}>
        <div className="shell-action-row">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full shadow-[0_8px_16px_-14px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)]">
            <img src="/ordo-avatar.png" alt="" width={32} height={32} className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="shell-panel-heading">{title}</h3>
            <div className="shell-action-row leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              <span className="shell-meta-text opacity-40">
                {subtitle}
              </span>
            </div>
          </div>
        </div>
        
        <div className="shell-action-row">
          <button
            onClick={onFullScreenToggle}
            className="icon-btn"
            aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onMinimize}
            className="icon-btn"
            aria-label="Minimize Chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
      <header className="glass-surface sticky top-0 z-30 flex h-14 items-center justify-between border-b border-color-theme px-(--container-padding) shadow-[0_10px_30px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)] transition-colors duration-500">
      <div className="shell-action-row">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full shadow-[0_8px_16px_-14px_color-mix(in_srgb,var(--shadow-base)_8%,transparent)]">
          <img src="/ordo-avatar.png" alt="" width={32} height={32} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h1 className="shell-panel-heading leading-none">{title}</h1>
          <span className="shell-meta-text opacity-50">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="shell-action-row">
        {/* Search */}
        <div className="relative group hidden sm:block">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="absolute inset-s-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Filter session..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-surface-muted border-none rounded-full ps-9 pe-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-accent/20 w-40 transition-all focus:w-64"
          />
        </div>

        {/* Density */}
        <div className="shell-action-row rounded-full bg-surface-muted p-1">
          {(["compact", "normal", "relaxed"] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDensityChange(d)}
              className={`shell-micro-text flex h-7 w-7 items-center justify-center rounded-full transition-all ${density === d ? "accent-fill shadow-sm" : "hover-surface opacity-50"}`}
              title={`Density: ${d}`}
              aria-label={`Set density to ${d}`}
            >
              {d[0].toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grid Toggle */}
        <button
          onClick={onGridToggle}
          className={`p-2 rounded-full transition-all ${gridEnabled ? "accent-fill" : "hover-surface"}`}
          title="Toggle Design Grid"
          aria-label="Toggle Design Grid"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </button>
      </div>
    </header>
  );
};
