import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderReactPage } from "../src/render.js";

describe("renderReactPage", () => {
  it("renders a React node to a self-contained HTML document", async () => {
    const html = await renderReactPage(
      createElement("div", { className: "text-xl" }, "Hola"),
      { title: "Smoke" },
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Smoke</title>");
    // React markup is present, with the Tailwind class preserved.
    expect(html).toContain('<div class="text-xl">Hola</div>');
  });

  it("compiles the used Tailwind utility into inline CSS in <head>", async () => {
    const html = await renderReactPage(
      createElement("div", { className: "text-xl" }, "Hola"),
    );

    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain("<style>");
    // The .text-xl utility resolves inside the compiled stylesheet.
    expect(head).toContain(".text-xl");
  });

  it("escapes the title to prevent markup injection in <head>", async () => {
    const html = await renderReactPage(createElement("div", null, "x"), {
      title: "<script>alert(1)</script>",
    });

    expect(html).toContain("<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>");
  });
});
