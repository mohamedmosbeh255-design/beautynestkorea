declare const __dirname: string;

/**
 * Minimal module shims so `tsc -p tsconfig.json` can typecheck with ZERO dependencies.
 * Only the handful of built-ins actually used by this tool are declared.
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readdirSync(path: string): string[];
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}