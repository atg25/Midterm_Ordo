import { describe, it, expect } from "vitest";
import { RoleAwareSearchFormatter } from "@/core/tool-registry/ToolResultFormatter";
import type { ToolExecutionContext } from "@/core/tool-registry/ToolExecutionContext";

const anonCtx: ToolExecutionContext = { role: "ANONYMOUS", userId: "anon" };
const authCtx: ToolExecutionContext = { role: "AUTHENTICATED", userId: "user-1" };

const fullResults = [
  {
    book: "1. Software Engineering",
    bookNumber: "1",
    chapter: "Intro",
    chapterSlug: "intro",
    bookSlug: "software-engineering",
    matchContext: "some context...",
    relevance: 15,
  },
];

describe("RoleAwareSearchFormatter", () => {
  const formatter = new RoleAwareSearchFormatter();

  // TEST-FMT-01
  it("ANON search result strips matchContext, bookSlug, chapterSlug", () => {
    const result = formatter.format("search_books", fullResults, anonCtx) as Record<string, unknown>[];
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("book");
    expect(result[0]).toHaveProperty("bookNumber");
    expect(result[0]).toHaveProperty("chapter");
    expect(result[0]).toHaveProperty("relevance");
    expect(result[0]).not.toHaveProperty("matchContext");
    expect(result[0]).not.toHaveProperty("bookSlug");
    expect(result[0]).not.toHaveProperty("chapterSlug");
  });

  // TEST-FMT-02
  it("AUTH search result preserves full data", () => {
    const result = formatter.format("search_books", fullResults, authCtx);
    expect(result).toEqual(fullResults);
  });

  // TEST-FMT-03
  it("non-search tool result passes through unchanged", () => {
    const data = { operation: "add", a: 2, b: 3, result: 5 };
    const result = formatter.format("calculator", data, anonCtx);
    expect(result).toEqual(data);
  });
});
