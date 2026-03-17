import { redirect } from "next/navigation";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/library/${resolvedParams.book}/${resolvedParams.chapter}`);
}
