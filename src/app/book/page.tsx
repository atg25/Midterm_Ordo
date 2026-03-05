import { redirect } from "next/navigation";
import { getChapters } from "@/lib/book";

export default async function BookIndex() {
    const chapters = await getChapters();
    if (chapters.length > 0) {
        redirect(`/book/${chapters[0].slug}`);
    }
    return <div>No chapters found.</div>;
}
