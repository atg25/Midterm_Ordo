import { describe, expect, it, vi } from "vitest";

const {
  getCorpusIndexMock,
  redirectMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getCorpusIndexMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("@/lib/corpus-library", () => ({
  getCorpusIndex: getCorpusIndexMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

import CorpusSectionResolverPage from "@/app/corpus/section/[slug]/page";

describe("corpus section resolver route", () => {
  it("redirects a section slug to the canonical corpus route", async () => {
    getCorpusIndexMock.mockResolvedValue([
      {
        bookSlug: "software-engineering",
        chapterSlug: "audit-to-sprint",
      },
    ]);

    await expect(
      CorpusSectionResolverPage({
        params: Promise.resolve({ slug: "audit-to-sprint" }),
      }),
    ).rejects.toThrow("redirect:/corpus/software-engineering/audit-to-sprint");
  });

  it("returns notFound for unknown section slugs", async () => {
    getCorpusIndexMock.mockResolvedValue([]);

    await expect(
      CorpusSectionResolverPage({ params: Promise.resolve({ slug: "missing-section" }) }),
    ).rejects.toThrow("notFound");
  });
});