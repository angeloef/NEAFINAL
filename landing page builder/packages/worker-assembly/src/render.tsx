import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "@tailwindcss/node";

const TAILWIND_INPUT = '@import "tailwindcss";';

export interface RenderReactPageOptions {
  lang?: string;
  title?: string;
}

/**
 * Render a React element to a self-contained static HTML document with the
 * Tailwind utilities it uses compiled to inline CSS in <head>. No client JS.
 *
 * ponytail: Tailwind is recompiled per call. Memoize the design system if page
 * generation ever runs hot (the `@import "tailwindcss"` input is constant).
 */
export async function renderReactPage(
  node: ReactElement,
  options: RenderReactPageOptions = {},
): Promise<string> {
  const body = renderToStaticMarkup(node);
  const css = await compileTailwind(extractCandidates(body));
  const lang = escapeAttr(options.lang ?? "es");
  const title = escapeHtml(options.title ?? "");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;
}

/** Compile Tailwind CSS for the given class candidates. */
async function compileTailwind(candidates: string[]): Promise<string> {
  const compiler = await compile(TAILWIND_INPUT, {
    base: import.meta.dirname,
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

/** Extract unique class tokens from rendered HTML to feed Tailwind. */
function extractCandidates(html: string): string[] {
  const classes = new Set<string>();
  const re = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    for (const token of match[1].split(/\s+/)) {
      if (token) classes.add(token);
    }
  }
  return [...classes];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
