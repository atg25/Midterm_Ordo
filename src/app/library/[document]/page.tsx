import { redirect } from "next/navigation";

import { getDocuments, getCorpusSummaries } from "@/lib/corpus-library";

export async function generateStaticParams() {
  const documents = await getDocuments();
  return documents.map((document) => ({ document: document.slug }));
}

export default async function LibraryDocumentPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const resolvedParams = await params;
  const [documents, summaries] = await Promise.all([getDocuments(), getCorpusSummaries()]);

  const document = documents.find((item) => item.slug === resolvedParams.document);
  if (!document) {
    redirect("/library");
  }

  const summary = summaries.find((item) => item.slug === document.slug);
  if (summary?.chapterSlugs?.[0] ?? summary?.sectionSlugs?.[0]) {
    const firstChapter = summary.chapterSlugs?.[0] ?? summary.sectionSlugs?.[0];
    redirect(`/library/${document.slug}/${firstChapter}`);
  }

  redirect("/library");
}