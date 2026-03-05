"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function Sandbox() {
    const [borderRadius, setBorderRadius] = useState<number>(8);
    const [borderWidth, setBorderWidth] = useState<number>(1);
    const [accentHue, setAccentHue] = useState<number>(220);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--border-radius", `${borderRadius}px`);
        root.style.setProperty("--border-width", `${borderWidth}px`);
        // We use HSL for a highly visible pure hue shift
        root.style.setProperty("--accent-color", `hsl(${accentHue}, 80%, 50%)`);
        root.style.setProperty("--accent-foreground", `hsl(${accentHue}, 100%, 98%)`);

        return () => {
            // Clean up the inline overrides when leaving the sandbox
            root.style.removeProperty("--border-radius");
            root.style.removeProperty("--border-width");
            root.style.removeProperty("--accent-color");
            root.style.removeProperty("--accent-foreground");
        };
    }, [borderRadius, borderWidth, accentHue]);

    return (
        <div className="min-h-screen bg-[var(--background)] p-6 font-sans text-[var(--foreground)] transition-colors duration-300">
            <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                <header className="rounded-theme flex flex-col sm:flex-row justify-between items-start gap-4 border-theme border-color-theme bg-[var(--background)] p-4 shadow-theme transition-all duration-300">
                    <div>
                        <h1 className="text-xl font-semibold">Design Token Sandbox</h1>
                        <p className="text-sm opacity-70">
                            Adjust the sliders below to dynamically redefine the site's physics. This demonstrates the concepts from Chapter 6: Design as a Calculus.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="text-xs font-bold uppercase tracking-wider text-accent-theme hover:opacity-80 whitespace-nowrap"
                    >
                        ← Back to Chat
                    </Link>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Controls */}
                    <div className="rounded-theme border-theme border-color-theme bg-[var(--background)] p-6 shadow-theme flex flex-col gap-6 transition-all duration-300">
                        <h2 className="text-lg font-medium border-b border-theme border-color-theme pb-2">Constraints & Variables</h2>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold uppercase tracking-wider opacity-70">
                                Border Radius ({borderRadius}px)
                            </label>
                            <input
                                type="range" min="0" max="32" value={borderRadius}
                                onChange={(e) => setBorderRadius(Number(e.target.value))}
                                className="w-full accent-accent-theme"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold uppercase tracking-wider opacity-70">
                                Border Width ({borderWidth}px)
                            </label>
                            <input
                                type="range" min="0" max="16" value={borderWidth}
                                onChange={(e) => setBorderWidth(Number(e.target.value))}
                                className="w-full accent-accent-theme"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold uppercase tracking-wider opacity-70">
                                Primary Accent Hue ({accentHue}°)
                            </label>
                            <input
                                type="range" min="0" max="360" value={accentHue}
                                onChange={(e) => setAccentHue(Number(e.target.value))}
                                className="w-full accent-accent-theme"
                            />
                        </div>

                        <div className="pt-4 border-t border-theme border-color-theme">
                            <p className="text-xs opacity-60 mb-4 whitespace-normal">
                                Notice how changing the historical theme below interacts with your slider overrides above in real-time.
                            </p>
                            <ThemeSwitcher />
                        </div>
                    </div>

                    {/* Canvas View */}
                    <div className="rounded-theme border-theme border-color-theme bg-[var(--background)] p-6 shadow-theme flex flex-col gap-6 transition-all duration-300 sticky top-6">
                        <h2 className="text-lg font-medium border-b border-theme border-color-theme pb-2">Live UI Render Canvas</h2>
                        <div className="flex flex-col gap-6">
                            <button className="rounded-theme bg-accent-theme px-6 py-3 font-medium shadow-theme w-full text-center hover:opacity-90 active:scale-95 transition-all text-xl">
                                Primary Interaction
                            </button>
                            <div className="rounded-theme border-theme border-color-theme p-4 shadow-theme transition-all">
                                <h3 className="text-accent-theme font-bold mb-2">Architectural Card Component</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    This card relies entirely on the mathematical <code>var(--border-radius)</code>, <code>var(--border-width)</code>, and <code>var(--accent-color)</code> variables.
                                    When you drag the sliders, this layout recalculates instantly at 60fps, entirely bypassing standard CSS media queries.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
