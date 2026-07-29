import type { CSSProperties, ReactNode } from "react";
import { clampInterp } from "./timing";

type Props = {
  t: number;
  from: number;
  duration?: number;
  translateY?: number;
  style?: CSSProperties;
  children: ReactNode;
};

export const FadeIn = ({
  t,
  from,
  duration = 12,
  translateY = 14,
  style,
  children,
}: Props) => {
  const opacity = clampInterp(t, [from, from + duration], [0, 1]);
  const ty = clampInterp(t, [from, from + duration], [translateY, 0]);
  return (
    <div style={{ opacity, translate: `0px ${ty}px`, ...style }}>
      {children}
    </div>
  );
};
