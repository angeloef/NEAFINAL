import type { SoftData } from "./types.js";

export interface ScrapedContent {
  html: string;
  ogImage?: string;
  title?: string;
}

/**
 * Fetch website content via Playwright (handles JS-rendered pages).
 * Returns scraped HTML and meta tags relevant to soft data extraction.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  // ponytail: dynamic import keeps Playwright out of process when not needed
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });

    const html = await page.content();
    const ogImage = await page
      .$eval('meta[property="og:image"]', (el) => el.getAttribute("content"))
      .catch(() => undefined) ?? undefined;
    const title = await page.title().catch(() => undefined);

    return { html, ogImage: ogImage ?? undefined, title };
  } finally {
    await browser.close();
  }
}
