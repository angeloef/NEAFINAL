// Design tokens for the "01 Analizar" card film.
// Palette is the .hpg section palette from neasistemas_home/index.html so the
// video and the page it is embedded in read as one surface.

// Palette: coolors.co/efece7-000000-ffb400-f63e02-246eb9
// Each accent carries one meaning and only that meaning, so the four acts read
// as an argument instead of four colour schemes:
//   VERMILION  your objective, and everything that descends from it (the thread)
//   BLUE       what comes from outside — competitors, the market
//   AMBER      what the business already had — its own data
// Never more than two accents on screen at once.
export const PAPER = "#EFECE7";
export const INK = "#000000";
export const INK_SOFT = "#6A665F";
export const HAIRLINE = "rgba(0,0,0,0.13)";
export const VERMILION = "#F63E02";
export const AMBER = "#FFB400";
export const BLUE = "#246EB9";

export const W = 1280;
export const H = 800;

// The page overlays this video. These regions are NOT ours to use:
//  - the black "01 Analizar" tag sits top-left  -> keep bright + empty
//  - a bottom scrim + white title/description   -> anything below is invisible
// Measured against index.html: .hpg__tag is black type laid straight on the video
// top-left, and .hpg__scrim goes fully opaque from the bottom up. Both are hard
// keep-outs, not preferences.
export const SAFE = {
  x: 76,
  y: 165,
  w: 1128,
  h: 290,
  tagRight: 470, // x < this AND y < tagBottom must stay >= 248 luminance
  tagBottom: 160,
  scrimTop: 455, // nothing below this survives the page scrim
};

export const COL = {
  leftX: 76,
  leftW: 556,
  rightX: 676,
  rightW: 532,
  top: 214, // below the tag band
  bottom: 405, // below this the page scrim swallows everything (measured)
};

export const FPS = 30;
export const DURATION = 624; // 20.8s

// Act boundaries. The footage window is a shared element that travels across
// them, so these are camera moves, not cuts.
//
// 156 frames each, and the length is not arbitrary. An act needs three things
// in order: ~66 frames to finish arriving (the slowest is act 3, where the
// total has to land), a hold where the section is complete and readable, and
// the 30-frame moveout. At the old 104 the hold was zero — the copy started
// leaving at 74 while the last word was still settling at 66, so no section
// was ever fully on screen. 156 buys a 60-frame hold, two full seconds.
export const ACTS = [
  { start: 0, end: 156 },
  { start: 156, end: 312 },
  { start: 312, end: 468 },
  { start: 468, end: 624 },
];

export const FADE = 12; // loop bookend: content dissolves to paper at both ends
