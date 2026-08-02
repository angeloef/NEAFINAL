// Design tokens for the "01 Analizar" card film.
// Palette is the .hpg section palette from neasistemas_home/index.html so the
// video and the page it is embedded in read as one surface.

export const PAPER = "#F4F2EE"; // sits next to the section bone #EFECE7
export const INK = "#0B0B0B";
export const INK_SOFT = "#6A665F";
export const HAIRLINE = "rgba(11,11,11,0.13)";
export const VERMILION = "#F63E02";
export const AMBER = "#FFB400";
export const BLUE = "#246EB9";

export const W = 1280;
export const H = 800;

// The page overlays this video. These regions are NOT ours to use:
//  - the black "01 Analizar" tag sits top-left  -> keep bright + empty
//  - a bottom scrim + white title/description   -> anything below is invisible
export const SAFE = {
  tagRight: 560,
  tagBottom: 200,
  scrimTop: 560, // fully dark from ~655 down
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
export const DURATION = 420; // 14s

// Act boundaries. The footage window is a shared element that travels across
// them, so these are camera moves, not cuts.
export const ACTS = [
  { start: 0, end: 104 },
  { start: 104, end: 206 },
  { start: 206, end: 312 },
  { start: 312, end: 420 },
];

export const FADE = 12; // loop bookend: content dissolves to paper at both ends
