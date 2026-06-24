import { z } from "zod";

const Hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "color hex inválido");

/** tokens.json — salida del worker Marca/Tokens (spec §12). */
export const Tokens = z.object({
  mission_id: z.string().min(1),
  color: z.object({
    primary: Hex,
    secondary: Hex.optional(),
    surface: Hex,
    text: Hex,
    accent: Hex.optional(),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
  }),
  /** BR-01: sin logo real -> monograma; nunca un logo inventado como propio. */
  logo: z.object({
    tipo: z.enum(["monograma", "real"]),
    valor: z.string().min(1),
  }),
  radius: z.string().optional(),
});
export type Tokens = z.infer<typeof Tokens>;
