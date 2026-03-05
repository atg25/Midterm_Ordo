import fs from "fs/promises";
import path from "path";

const CHAPTERS_DIR = path.join(process.cwd(), "docs/design-book/chapters");

export interface ChapterMeta {
    slug: string;
    title: string;
    filename: string;
}

export async function getChapters(): Promise<ChapterMeta[]> {
    const files = await fs.readdir(CHAPTERS_DIR);
    // Simple alphabetical sort handles ch00, ch01, etc.
    const markdownFiles = files.filter(f => f.endsWith(".md")).sort();

    return Promise.all(markdownFiles.map(async (filename) => {
        const slug = filename.replace(/\.md$/, "");
        const content = await fs.readFile(path.join(CHAPTERS_DIR, filename), "utf-8");
        // Extract the first H1 for the title
        const match = content.match(/^#\s+(.*)/m);
        const title = match ? match[1] : slug;

        return { slug, title, filename };
    }));
}

export async function getChapterContent(slug: string): Promise<string | null> {
    try {
        const content = await fs.readFile(path.join(CHAPTERS_DIR, `${slug}.md`), "utf-8");
        return content;
    } catch (e) {
        return null;
    }
}
