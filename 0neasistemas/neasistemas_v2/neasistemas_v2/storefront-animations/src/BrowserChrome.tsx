import type { ReactNode } from "react";
import { Interactive } from "remotion";
import { BORDER, SURFACE_MUTED } from "./colors";

export const FRAME = {
  x: 140,
  y: 140,
  width: 1000,
  height: 520,
  chromeHeight: 56,
};

export const BrowserChrome = ({ children }: { children: ReactNode }) => (
  <Interactive.Div
    name="BrowserFrame"
    style={{
      position: "absolute",
      left: FRAME.x,
      top: FRAME.y,
      width: FRAME.width,
      height: FRAME.height,
      borderRadius: 24,
      border: `1.5px solid ${BORDER}`,
      overflow: "hidden",
      background: "#ffffff",
      boxShadow:
        "0 30px 60px rgba(20,30,60,0.18), 0 4px 14px rgba(20,30,60,0.08)",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: FRAME.chromeHeight,
        background: SURFACE_MUTED,
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 24,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: "#e4967a",
        }}
      />
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: "#e8c25f",
        }}
      />
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: "#6fbf6f",
        }}
      />
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: FRAME.chromeHeight,
        width: "100%",
        height: FRAME.height - FRAME.chromeHeight,
      }}
    >
      {children}
    </div>
  </Interactive.Div>
);
