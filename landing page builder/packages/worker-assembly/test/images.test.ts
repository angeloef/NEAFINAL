import { describe, it, expect } from "vitest";
import { pickImages, POOL_IDS } from "../src/blocks/images.js";

describe("pickImages", () => {
  it("returns no repeated images when filling N blocks", () => {
    const roles = ["hero", "about", "cta", "areas", "contact", "extra1", "extra2"];
    const picked = pickImages(roles);

    expect(picked).toHaveLength(roles.length);
    const urls = new Set(picked.map((p) => p.url));
    expect(urls.size).toBe(roles.length);
  });

  it("never repeats across the entire pool", () => {
    const roles = POOL_IDS.map((_, i) => `block-${i}`);
    const picked = pickImages(roles);
    const urls = new Set(picked.map((p) => p.url));
    expect(urls.size).toBe(POOL_IDS.length);
  });

  it("gives every picked image a non-empty thematic alt", () => {
    const picked = pickImages(["hero", "about", "cta", "areas", "contact"]);
    for (const img of picked) {
      expect(img.alt.trim().length).toBeGreaterThan(0);
    }
  });

  it("assigns distinct categories to hero, about and cta", () => {
    const [hero, about, cta] = pickImages(["hero", "about", "cta"]);
    expect(hero.category).not.toBe(about.category);
    expect(about.category).not.toBe(cta.category);
    expect(hero.category).not.toBe(cta.category);
  });

  it("applies the requested width and quality params to URLs", () => {
    const [img] = pickImages(["hero"], 1920);
    expect(img.url).toContain("w=1920");
    expect(img.url).toContain("q=70");
    expect(img.url).toContain("images.unsplash.com");
  });

  it("throws when more roles are requested than images available", () => {
    const tooMany = Array.from({ length: POOL_IDS.length + 1 }, (_, i) => `b${i}`);
    expect(() => pickImages(tooMany)).toThrow(/exhausted/);
  });
});
