/**
 * Ambient declarations for the Node globals used by this tool.
 * Kept in a dedicated tiny file (not mixed with other declarations) so the scoped
 * `tsc -p tsconfig.json` check can run with ZERO dependencies — no @types/node.
 * DOM lib already provides fetch, Response, Headers, AbortController, URL, console, setTimeout.
 */
declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode: number | undefined;
  version: string;
};

declare const Buffer: {
  byteLength(input: string, encoding?: string): number;
};