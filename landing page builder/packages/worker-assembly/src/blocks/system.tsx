import type { CSSProperties, ReactNode } from "react";
import { isVerified, type FieldClass, type Tokens } from "@lpb/contracts";

/**
 * Shared design system for the block library.
 *
 * Design tokens map to CSS custom properties on the page root (`tokensToStyle`);
 * blocks reference them through Tailwind arbitrary-value utilities like
 * `bg-[var(--color-primary)]`. One palette/typography source, premium and
 * consistent across every block. No client JS — static markup only.
 */

/** Map validated Tokens to the CSS custom properties every block reads. */
export function tokensToStyle(tokens: Tokens): CSSProperties {
  const c = tokens.color;
  return {
    "--color-primary": c.primary,
    "--color-secondary": c.secondary ?? c.primary,
    "--color-surface": c.surface,
    "--color-text": c.text,
    "--color-accent": c.accent ?? c.primary,
    // Derived deep shade for dark sections / overlays.
    "--color-ink": `color-mix(in srgb, ${c.primary} 78%, #000)`,
    "--color-tint": `color-mix(in srgb, ${c.primary} 5%, ${c.surface})`,
    "--font-heading": `'${tokens.typography.headingFont}', Georgia, serif`,
    "--font-body": `'${tokens.typography.bodyFont}', system-ui, sans-serif`,
    "--radius": tokens.radius ?? "8px",
  } as CSSProperties;
}

/** Reusable utility-class strings — DRY styling shared by blocks. */
export const ui = {
  section: "px-6 py-[clamp(3.5rem,6vw,6rem)]",
  container: "mx-auto max-w-[1140px]",
  eyebrow:
    "mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]",
  title:
    "mb-10 text-center font-[var(--font-heading)] text-[clamp(1.9rem,4.5vw,3rem)] font-bold leading-tight text-[var(--color-primary)]",
  cta: "inline-block rounded-[var(--radius)] bg-[var(--color-accent)] px-11 py-4 font-[var(--font-body)] font-semibold text-[var(--color-ink)] no-underline shadow-lg transition hover:-translate-y-0.5",
  card: "rounded-[var(--radius)] border border-black/10 bg-white p-7",
} as const;

/** Opaque dark overlay for image-backed sections (avoids Tailwind color-mix). */
export const overlayStyle: CSSProperties = {
  backgroundColor: "var(--color-ink)",
  opacity: 0.85,
};

/**
 * Render `children` plainly when the datum is a verified fact; otherwise tag it
 * as illustrative. LG-01 / AC-02: template content must never read as a
 * verified claim about the firm (results, team, testimonials, etc.).
 */
export function Fact({
  clase,
  children,
}: {
  clase: FieldClass;
  children: ReactNode;
}) {
  if (isVerified(clase)) return <>{children}</>;
  return (
    <span data-placeholder="true">
      {children}
      <sup className="ml-1 align-super text-[0.6em] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
        ejemplo
      </sup>
    </span>
  );
}

/** True when every fact-class in the list is non-verified (a placeholder block). */
export function allPlaceholder(clases: FieldClass[]): boolean {
  return clases.length > 0 && clases.every((c) => !isVerified(c));
}

/** Caption marking an entire section as illustrative template content. */
export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p
      data-placeholder="true"
      className="mt-6 text-center text-xs italic opacity-60"
    >
      {children}
    </p>
  );
}
