import { getChapters } from "@/lib/book";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default async function BookLayout({ children }: { children: React.ReactNode }) {
    const chapters = await getChapters();

    return (
        <div className="flex min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-300">
            {/* Sidebar Table of Contents */}
            <aside className="w-72 shrink-0 border-r border-theme border-color-theme p-6 hidden md:flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto">
                <div>
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-wider opacity-70">
                        Design Engineering
                    </h2>
                    <nav className="flex flex-col gap-3">
                        {chapters.map((chapter) => (
                            <Link
                                key={chapter.slug}
                                href={`/book/${chapter.slug}`}
                                className="text-sm opacity-80 hover:opacity-100 hover:text-accent-theme transition-colors"
                            >
                                {chapter.title}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto flex flex-col gap-6 pt-6 border-t border-theme border-color-theme">
                    <ThemeSwitcher />
                    <Link
                        href="/"
                        className="text-xs uppercase tracking-wider font-bold text-accent-theme hover:opacity-80 transition-opacity"
                    >
                        ← Back to Claude Chat
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden p-6 lg:p-12 pb-24">
                {/* Mobile Nav Top Bar */}
                <div className="md:hidden flex justify-between items-center mb-8 pb-4 border-b border-theme border-color-theme">
                    <Link
                        href="/"
                        className="text-xs uppercase tracking-wider font-bold text-accent-theme"
                    >
                        ← Chat
                    </Link>
                    <div className="scale-75 origin-right">
                        <ThemeSwitcher />
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
