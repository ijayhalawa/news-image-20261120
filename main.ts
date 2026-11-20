// news-image-20261120 — "20 November 2026: World News in One Image"
// A deterministic newspaper front page, drawn entirely in code.
// Node 22, standard library only (node:fs, node:path, node:zlib, node:crypto).
// No network, no external assets: every pixel comes from the code below.
// The program writes entry.png (1024x1024, PNG) to $MAKEFUN_OUTPUT_DIR
// (default /output). Two runs produce byte-identical output.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------------------
// 5x7 bitmap font, drawn by hand. Each glyph is 7 rows of 5 cells.
// '#' = ink, '.' = empty. Covers A-Z, a-z, 0-9 and common punctuation.
// ---------------------------------------------------------------------------

const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#..#", ".#...", "###..", ".#...", ".#...", ".#..."],
  g: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#", ".###."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
  j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", "...#.", ".##.."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "####.", "#....", "#...."],
  q: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#", "....#"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "###..", ".#...", ".#...", ".#...", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: [".....", ".....", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
  z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.###", "#..##"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "\u2014": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "\u2022": [".....", ".....", ".###.", ".###.", ".###.", ".....", "....."],
};

// Glyphs with descenders (g, j, p, q, y) have 8 rows; the font is drawn
// top-aligned on a 7-row cell and descenders may paint one row below it.
// To keep lines from colliding, line height accounts for that.

// ---------------------------------------------------------------------------
// Canvas: an RGB buffer with tiny drawing primitives.
// ---------------------------------------------------------------------------

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const PAPER: RGB = [247, 242, 231];
const INK: RGB = [22, 21, 19];
const RED: RGB = [164, 31, 31];
const BLUE: RGB = [31, 78, 121];
const GREEN: RGB = [30, 107, 58];
const GOLD: RGB = [184, 138, 30];
const ORANGE: RGB = [196, 90, 20];
const GREY: RGB = [138, 131, 120];
const LIGHT: RGB = [232, 226, 212];

class Canvas {
  data: Buffer;
  constructor() {
    this.data = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = PAPER[0];
      this.data[i * 3 + 1] = PAPER[1];
      this.data[i * 3 + 2] = PAPER[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }
  hline(x: number, y: number, w: number, c: RGB): void {
    for (let xx = x; xx < x + w; xx++) this.set(xx, y, c);
  }
  vline(x: number, y: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) this.set(x, yy, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  // Thick line: draw the line several times, offset perpendicular-ish.
  thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
    for (let o = 0; o < t; o++) {
      this.line(x0, y0 + o, x1, y1 + o, c);
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, fill: boolean): void {
    for (let yy = cy - r; yy <= cy + r; yy++) {
      for (let xx = cx - r; xx <= cx + r; xx++) {
        const d = (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy);
        if (fill ? d <= r * r : d <= r * r && d >= (r - 1) * (r - 1)) this.set(xx, yy, c);
      }
    }
  }
  // Filled triangle via bounding-box point-in-triangle test.
  triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minX = Math.min(x0, x1, x2);
    const maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
    if (d === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
        const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
        const cc = 1 - a - b;
        if (a >= 0 && b >= 0 && cc >= 0) this.set(x, y, c);
      }
    }
  }
  // Outlined rectangle.
  frame(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
}

// ---------------------------------------------------------------------------
// Text rendering on the bitmap font.
// ---------------------------------------------------------------------------

function glyph(ch: string): string[] {
  return FONT[ch] ?? FONT["?"];
}

function textWidth(s: string, scale: number, spacing = 0): number {
  let w = 0;
  for (const ch of s) w += 6 * scale + spacing;
  return w > 0 ? w - spacing : 0;
}

function drawText(cv: Canvas, s: string, x: number, y: number, scale: number, c: RGB, spacing = 0): void {
  let cx = x;
  for (const ch of s) {
    const g = glyph(ch);
    for (let r = 0; r < g.length; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row[col] === "#") {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              cv.set(cx + col * scale + dx, y + r * scale + dy, c);
            }
          }
        }
      }
    }
    cx += 6 * scale + spacing;
  }
}

function drawTextCentered(cv: Canvas, s: string, cx: number, y: number, scale: number, c: RGB, spacing = 0): void {
  drawText(cv, s, cx - Math.floor(textWidth(s, scale, spacing) / 2), y, scale, c, spacing);
}

// Greedy word wrap. Returns lines that fit maxWidth pixels at scale.
function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder: 8-bit RGB, filter 0, zlib level 9. Fully deterministic.
// ---------------------------------------------------------------------------

const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(cv: Canvas): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    cv.data.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Icons: small line drawings, one per story. Each draws inside a 70x70 box
// at (x, y), scaled by k. All coordinates are in the icon's local space.
// ---------------------------------------------------------------------------

type Pt = [number, number];
function at(x: number, y: number, k: number, lx: number, ly: number): Pt {
  return [Math.round(x + lx * k), Math.round(y + ly * k)];
}

function drawDrone(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  // Arms from the body to the four rotors.
  for (const [ax, ay] of [[12, 14], [58, 14], [12, 56], [58, 56]] as Pt[]) {
    const [x0, y0] = c(35, 35);
    const [x1, y1] = c(ax, ay);
    cv.thickLine(x0, y0, x1, y1, Math.max(2, Math.round(2 * k)), INK);
  }
  // Rotor discs.
  for (const [ax, ay] of [[12, 14], [58, 14], [12, 56], [58, 56]] as Pt[]) {
    const [rx, ry] = c(ax, ay);
    const half = Math.round(9 * k);
    const th = Math.max(2, Math.round(2 * k));
    for (let o = 0; o < th; o++) cv.hline(rx - half, ry + o, half * 2, INK);
    cv.circle(rx, ry, Math.max(2, Math.round(2 * k)), INK, true);
  }
  // Body and camera eye.
  const [bx, by] = c(26, 29);
  cv.rect(bx, by, Math.round(18 * k), Math.round(12 * k), INK);
  const [ex, ey] = c(32, 32);
  cv.rect(ex, ey, Math.round(5 * k), Math.round(5 * k), RED);
}

function drawScales(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  const [px, py] = c(35, 10);
  cv.circle(px, py - Math.round(3 * k), Math.max(2, Math.round(2 * k)), INK, true);
  cv.thickLine(px, py, px, py + Math.round(46 * k), Math.max(2, Math.round(2 * k)), INK);
  const [b0x, b0y] = c(10, 10);
  const [b1x] = c(60, 10);
  cv.thickLine(b0x, b0y, b1x, b0y, Math.max(2, Math.round(2 * k)), INK);
  for (const cx of [13, 57]) {
    const [tx, ty] = c(cx, 11);
    const [l0x, l0y] = c(cx - 7, 34);
    const [l1x] = c(cx + 7, 34);
    cv.line(tx, ty, l0x, l0y, INK);
    cv.line(tx, ty, l1x, l0y, INK);
    const [p0x, p0y] = c(cx - 9, 34);
    const [p1x] = c(cx + 9, 34);
    const [p2x, p2y] = c(cx, 44);
    cv.triangle(p0x, p0y, p1x, p0y, p2x, p2y, INK);
  }
  const [f0x, f0y] = c(24, 58);
  cv.rect(f0x, f0y, Math.round(22 * k), Math.max(2, Math.round(3 * k)), INK);
}

function drawThermometer(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  // Tube outline.
  const [tx, ty] = c(28, 6);
  cv.frame(tx, ty, Math.round(12 * k), Math.round(42 * k), Math.max(2, Math.round(2 * k)), INK);
  // Mercury: red column rising into the tube and the bulb.
  const [mx, my] = c(31, 26);
  cv.rect(mx, my, Math.round(6 * k), Math.round(20 * k), RED);
  cv.circle(Math.round(x + 34 * k), Math.round(y + 52 * k), Math.round(9 * k), RED, true);
  cv.circle(Math.round(x + 34 * k), Math.round(y + 52 * k), Math.round(9 * k), INK, false);
  // Tick marks.
  for (const ly of [14, 22, 30, 38]) {
    const [t0x, t0y] = c(40, ly);
    cv.hline(t0x, t0y, Math.round(6 * k), INK);
  }
  // Rising arrow on the right.
  const [a0x, a0y] = c(56, 52);
  const [a1x, a1y] = c(56, 12);
  cv.thickLine(a0x, a0y, a1x, a1y, Math.max(2, Math.round(2 * k)), RED);
  const [h0x, h0y] = c(56, 8);
  const [h1x] = c(50, 18);
  const [h2x] = c(62, 18);
  cv.triangle(h0x, h0y, h1x, h0y + Math.round(10 * k), h2x, h0y + Math.round(10 * k), RED);
}

function drawTower(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  // The tower: shaft with a pointed crown.
  const [sx, sy] = c(24, 18);
  cv.rect(sx, sy, Math.round(22 * k), Math.round(44 * k), INK);
  const [t0x, t0y] = c(24, 18);
  const [t1x] = c(46, 18);
  const [t2x, t2y] = c(35, 6);
  cv.triangle(t0x, t0y, t1x, t0y, t2x, t2y, INK);
  // Windows.
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 3; col++) {
      const [wx, wy] = c(28 + col * 6, 24 + r * 7);
      cv.rect(wx, wy, Math.max(2, Math.round(3 * k)), Math.max(2, Math.round(3 * k)), LIGHT);
    }
  }
  // Explosion burst above the crown.
  const [bx, by] = c(54, 12);
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    const ex = Math.round(bx + Math.cos(ang) * 10 * k);
    const ey = Math.round(by + Math.sin(ang) * 10 * k);
    cv.thickLine(bx, by, ex, ey, Math.max(1, Math.round(1.5 * k)), RED);
  }
  cv.circle(bx, by, Math.max(2, Math.round(3 * k)), RED, true);
  // Ground line.
  const [g0x, g0y] = c(14, 64);
  cv.hline(g0x, g0y, Math.round(44 * k), INK);
}

function drawChartDown(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  const [o0x, o0y] = c(10, 8);
  const [o1x, o1y] = c(10, 60);
  const [o2x] = c(62, 60);
  cv.thickLine(o0x, o0y, o1x, o1y, Math.max(2, Math.round(2 * k)), INK);
  cv.thickLine(o1x, o1y, o2x, o1y, Math.max(2, Math.round(2 * k)), INK);
  // Falling line.
  const pts: Pt[] = [[14, 16], [26, 24], [36, 22], [48, 44], [60, 54]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = c(pts[i][0], pts[i][1]);
    const [x1, y1] = c(pts[i + 1][0], pts[i + 1][1]);
    cv.thickLine(x0, y0, x1, y1, Math.max(2, Math.round(3 * k)), RED);
  }
  const [hx, hy] = c(60, 54);
  cv.triangle(hx, hy, hx - Math.round(8 * k), hy - Math.round(2 * k), hx - Math.round(2 * k), hy - Math.round(8 * k), RED);
}

function drawFlags(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  const poles = [12, 32, 52];
  for (const px of poles) {
    const [x0, y0] = c(px, 10);
    cv.thickLine(x0, y0, x0, y0 + Math.round(52 * k), Math.max(2, Math.round(2 * k)), INK);
  }
  // Flag 1: stars and stripes.
  const [f0x, f0y] = c(12, 10);
  cv.rect(f0x, f0y, Math.round(18 * k), Math.round(12 * k), PAPER);
  cv.frame(f0x, f0y, Math.round(18 * k), Math.round(12 * k), 1, INK);
  cv.rect(f0x, f0y + Math.round(2 * k), Math.round(18 * k), Math.round(2 * k), RED);
  cv.rect(f0x, f0y + Math.round(6 * k), Math.round(18 * k), Math.round(2 * k), RED);
  cv.rect(f0x, f0y + Math.round(10 * k), Math.round(18 * k), Math.round(2 * k), RED);
  cv.rect(f0x, f0y, Math.round(8 * k), Math.round(6 * k), BLUE);
  // Flag 2: red with gold stars.
  const [f1x, f1y] = c(32, 10);
  cv.rect(f1x, f1y, Math.round(18 * k), Math.round(12 * k), RED);
  cv.circle(Math.round(x + 37 * k), Math.round(y + 15 * k), Math.max(2, Math.round(2 * k)), GOLD, true);
  cv.circle(Math.round(x + 43 * k), Math.round(y + 13 * k), 1, GOLD, true);
  cv.circle(Math.round(x + 45 * k), Math.round(y + 17 * k), 1, GOLD, true);
  // Flag 3: white-blue-red tricolour.
  const [f2x, f2y] = c(52, 10);
  cv.rect(f2x, f2y, Math.round(18 * k), Math.round(4 * k), PAPER);
  cv.frame(f2x, f2y, Math.round(18 * k), Math.round(12 * k), 1, INK);
  cv.rect(f2x, f2y + Math.round(4 * k), Math.round(18 * k), Math.round(4 * k), BLUE);
  cv.rect(f2x, f2y + Math.round(8 * k), Math.round(18 * k), Math.round(4 * k), RED);
}

function drawRocket(cv: Canvas, x: number, y: number, k: number): void {
  const c = (lx: number, ly: number): Pt => at(x, y, k, lx, ly);
  // Flame.
  const [fl0x, fl0y] = c(31, 50);
  const [fl1x] = c(39, 50);
  const [fl2x, fl2y] = c(35, 64);
  cv.triangle(fl0x, fl0y, fl1x, fl0y, fl2x, fl2y, ORANGE);
  // Body and nose.
  const [bx, by] = c(29, 14);
  cv.rect(bx, by, Math.round(12 * k), Math.round(36 * k), INK);
  const [n0x, n0y] = c(29, 14);
  const [n1x] = c(41, 14);
  const [n2x, n2y] = c(35, 4);
  cv.triangle(n0x, n0y, n1x, n0y, n2x, n2y, RED);
  // Window.
  cv.circle(Math.round(x + 35 * k), Math.round(y + 26 * k), Math.max(2, Math.round(3 * k)), BLUE, true);
  // Fins.
  const [f0x, f0y] = c(29, 42);
  const [f1x] = c(22, 54);
  cv.triangle(f0x, f0y, f1x, f0y + Math.round(12 * k), f0x, f0y + Math.round(8 * k), INK);
  const [g0x, g0y] = c(41, 42);
  const [g1x] = c(48, 54);
  cv.triangle(g0x, g0y, g1x, g0y + Math.round(12 * k), g0x, g0y + Math.round(8 * k), INK);
  // Upward tick marks.
  for (const ly of [8, 18]) {
    const [t0x, t0y] = c(56, ly);
    cv.hline(t0x, t0y, Math.round(8 * k), GREEN);
  }
}

// ---------------------------------------------------------------------------
// The day's news — reported 19-20 November 2026, checked against Reuters,
// BBC, AFP, AP and Le Monde round-ups on the morning of 20 November.
// ---------------------------------------------------------------------------

interface Story {
  kicker: string;
  headline: string;
  body: string;
  icon: (cv: Canvas, x: number, y: number, k: number) => void;
}

const LEAD: Story = {
  kicker: "UKRAINE WAR",
  headline: "UK SENDS 1,000 LONG-RANGE DRONES TO UKRAINE",
  body: "PM Andy Burnham unveiled a GBP 260m package in Berlin: drones that fly over 1,000 km, plus maritime and surveillance drones, to bolster Ukraine's defences this winter.",
  icon: drawDrone,
};

const STORIES: Story[] = [
  {
    kicker: "WORLD COURT",
    headline: "MYANMAR GUILTY OF GENOCIDE",
    body: "The court ruled 9-6 that Myanmar's 2017 crackdown on the Rohingya was genocide. Britain expelled its attache and called for UN action.",
    icon: drawScales,
  },
  {
    kicker: "CLIMATE - COP31",
    headline: "COP31 DRAFT DROPS FOSSIL-FUEL PHASE-OUT",
    body: "COP31 negotiators cut the draft to nine pages, dropping any mention of oil, gas or coal. It admits warming will pass 1.5C; talks close Friday.",
    icon: drawThermometer,
  },
  {
    kicker: "MIDDLE EAST",
    headline: "HOUTHIS STRIKE RIYADH TOWER",
    body: "Yemen's Houthis said they hit four Saudi targets, damaging Riyadh's tallest tower. Saudi defences downed two drones.",
    icon: drawTower,
  },
  {
    kicker: "MARKETS",
    headline: "TAIWAN STOCKS PLUNGE 2,200 POINTS",
    body: "Taipei's index fell over 2,200 points in a day to below 37,000, after shedding 7,000 in a week. The regulator unveiled five rescue measures.",
    icon: drawChartDown,
  },
  {
    kicker: "DIPLOMACY",
    headline: "TRUMP, XI AND PUTIN MEET IN SHENZHEN",
    body: "The three leaders held their first trilateral talks, with Ukraine top of the agenda. Europe expects to join new Ukraine peace talks soon.",
    icon: drawFlags,
  },
  {
    kicker: "TECH",
    headline: "ANTHROPIC SHARES SOAR ON NASDAQ DEBUT",
    body: "The maker of Claude rose 17% on its Nasdaq debut, the first frontier AI firm to go public. It will join MSCI and FTSE global indexes.",
    icon: drawRocket,
  },
];

const ALSO_TODAY =
  "ALSO TODAY: US sanctions the Comancheros gang and Italy's 'Ndrangheta. Estonia to close its Russia border in December. General strike in Spain disrupts ports and factories. Trump pardons baseball great Pete Rose, posthumously.";

// ---------------------------------------------------------------------------
// Layout: a newspaper front page, 1024x1024.
// ---------------------------------------------------------------------------

function render(): Canvas {
  const cv = new Canvas();
  const M = 30; // margin
  const RIGHT = W - M;

  // Page frame.
  cv.frame(12, 12, W - 24, H - 24, 2, INK);

  // Masthead.
  drawTextCentered(cv, "THE WORLD IN ONE IMAGE", W / 2, 32, 3, RED, 4);
  drawTextCentered(cv, "FRIDAY 20 NOVEMBER 2026", W / 2, 66, 6, INK);
  cv.rect(M, 118, RIGHT - M, 4, INK);
  cv.rect(M, 126, RIGHT - M, 2, RED);

  // Lead story.
  drawText(cv, LEAD.kicker, M, 140, 2, RED);
  const leadHead = wrapText(LEAD.headline, 740, 4);
  leadHead.forEach((ln, i) => drawText(cv, ln, M, 164 + i * 32, 4, INK));
  const leadBody = wrapText(LEAD.body, 740, 2);
  leadBody.forEach((ln, i) => drawText(cv, ln, M, 238 + i * 20, 2, INK));
  drawDrone(cv, 800, 150, 2.2);
  cv.rect(M, 306, RIGHT - M, 3, INK);

  // Six stories in rows.
  let rowY = 318;
  const ROW_H = 90;
  for (const s of STORIES) {
    s.icon(cv, M, rowY + 10, 1);
    cv.vline(108, rowY + 8, ROW_H - 16, GREY);
    drawText(cv, s.kicker, 116, rowY + 4, 2, RED);
    drawText(cv, s.headline, 116, rowY + 24, 3, INK);
    const body = wrapText(s.body, RIGHT - 116, 2);
    body.forEach((ln, i) => drawText(cv, ln, 116, rowY + 50 + i * 18, 2, INK));
    rowY += ROW_H;
    if (s !== STORIES[STORIES.length - 1]) {
      cv.hline(M, rowY, RIGHT - M, 1, GREY);
    }
  }

  // Also-today strip.
  const strip = wrapText(ALSO_TODAY, RIGHT - M, 2);
  strip.forEach((ln, i) => drawText(cv, ln, M, 872 + i * 20, 2, INK));

  // Footer.
  cv.rect(M, 944, RIGHT - M, 1, GREY);
  drawTextCentered(cv, "Sources: Reuters - BBC - AFP - AP - Le Monde", W / 2, 958, 2, INK);

  return cv;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry.png");
  const png = encodePng(render());
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${png.length} bytes)`);
}

main();
