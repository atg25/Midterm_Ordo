/**
 * Domain type for supported design themes.
 * Defined in core so commands and interactors can reference it
 * without depending on React component code.
 */
export type Theme =
  | "fluid"
  | "bauhaus"
  | "swiss"
  | "postmodern"
  | "skeuomorphic";
