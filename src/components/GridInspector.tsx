"use client";

import { useState, useEffect } from "react";

export function GridInspector() {
    const [enabled, setEnabled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'g') {
                setEnabled(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!mounted) return null;

    return (
        <>
            <button
                onClick={() => setEnabled(!enabled)}
                className="fixed bottom-4 right-4 z-50 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
            >
                {enabled ? "Hide Grid (Ctrl+G)" : "Show Grid (Ctrl+G)"}
            </button>

            {enabled && (
                <div className="pointer-events-none fixed inset-0 z-40 flex flex-col">
                    {/* Vertical Columns */}
                    <div className="absolute inset-0 mx-auto w-full max-w-3xl px-6 h-full">
                        <div className="grid h-full grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-12 opacity-30">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-full w-full bg-cyan-400/30 border-x border-cyan-400/50 hidden lg:block"
                                />
                            ))}
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={`tb-${i}`}
                                    className="h-full w-full bg-cyan-400/30 border-x border-cyan-400/50 hidden sm:block lg:hidden"
                                />
                            ))}
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={`mb-${i}`}
                                    className="h-full w-full bg-cyan-400/30 border-x border-cyan-400/50 sm:hidden"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Horizontal baselines to prove mathematical rhythm */}
                    <div className="absolute inset-0 h-full w-full overflow-hidden opacity-20"
                        style={{ backgroundImage: "linear-gradient(to bottom, transparent 95%, #06b6d4 100%)", backgroundSize: "100% 1rem" }}>
                    </div>
                </div>
            )}
        </>
    );
}
