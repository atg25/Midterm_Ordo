import { redirect } from "next/navigation";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ document: string; section: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/library/${resolvedParams.document}/${resolvedParams.section}`);
}