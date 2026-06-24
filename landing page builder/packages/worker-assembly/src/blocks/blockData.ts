import type { PageBlock } from "@lpb/contracts";

/** The `data` shape of a given block type, derived from the PagePlan union. */
export type BlockData<T extends PageBlock["type"]> = Extract<
  PageBlock,
  { type: T }
>["data"];
