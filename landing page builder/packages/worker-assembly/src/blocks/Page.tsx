import type { PageBlock, PagePlan, Tokens } from "@lpb/contracts";
import { pickImages, type PickedImage } from "./images.js";
import { tokensToStyle } from "./system.js";
import { Hero } from "./Hero.js";
import { TrustBar } from "./TrustBar.js";
import { Areas } from "./Areas.js";
import { About } from "./About.js";
import { Process } from "./Process.js";
import { Results } from "./Results.js";
import { Team } from "./Team.js";
import { Testimonials } from "./Testimonials.js";
import { Faq } from "./Faq.js";
import { CtaBand } from "./CtaBand.js";
import { Contact } from "./Contact.js";
import { Footer } from "./Footer.js";

/** Block types that render a background photo, and the image role they draw. */
const IMAGE_ROLE: Partial<Record<PageBlock["type"], string>> = {
  hero: "hero",
  about: "about",
  cta_band: "cta",
};

/**
 * Pure compositor: render an ordered PagePlan into a themed page.
 *
 * Image-backed blocks get one non-repeating photo each (picked by role).
 * Unknown block types are skipped rather than throwing — the discriminated
 * union keeps this exhaustive in practice, the default guards bad runtime data.
 */
export function Page({ plan, tokens }: { plan: PagePlan; tokens: Tokens }) {
  const imageRoles = plan.blocks
    .map((b) => IMAGE_ROLE[b.type])
    .filter((r): r is string => Boolean(r));
  const picked = pickImages(imageRoles);

  let imgIdx = 0;
  const nextImage = (type: PageBlock["type"]): PickedImage | undefined =>
    IMAGE_ROLE[type] ? picked[imgIdx++] : undefined;

  return (
    <div style={tokensToStyle(tokens)} className="bg-[var(--color-surface)] font-[var(--font-body)]">
      {plan.blocks.map((block, i) => (
        <RenderBlock key={i} block={block} image={nextImage(block.type)} />
      ))}
    </div>
  );
}

function RenderBlock({ block, image }: { block: PageBlock; image?: PickedImage }) {
  switch (block.type) {
    case "hero":
      return <Hero data={block.data} image={image} />;
    case "trust_bar":
      return <TrustBar data={block.data} />;
    case "areas":
      return <Areas data={block.data} />;
    case "about":
      return <About data={block.data} image={image} />;
    case "process":
      return <Process data={block.data} />;
    case "results":
      return <Results data={block.data} />;
    case "team":
      return <Team data={block.data} />;
    case "testimonials":
      return <Testimonials data={block.data} />;
    case "faq":
      return <Faq data={block.data} />;
    case "cta_band":
      return <CtaBand data={block.data} image={image} />;
    case "contact":
      return <Contact data={block.data} />;
    case "footer":
      return <Footer data={block.data} />;
    default:
      return null;
  }
}
