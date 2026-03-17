import { redirect } from "next/navigation";

export const metadata = {
  title: "Legacy Library Redirect",
  description: "Compatibility route preserved while the public IA moves to Library.",
};

export default async function CorpusIndex() {
  redirect("/library");
}