// Asgard: pisos, paredes, telas (runas no pergaminho), quadro, janela, relógio, paletas das salas e terreno externo.
// O desenho é puro (superficies-*.ts) e vira canvas uma vez por combinação de parâmetros, como em art/index.ts; por
// quadro, pisos e paredes só copiam blocos prontos, e telas, quadro, janela e relógio só fazem fillRect.
import { TILE, type Doorway, type FloorKind, type Sprite, type WallStyle } from '../api';
import { shade } from '../core/color';
import { toCanvas, toSprite } from '../index';
import { CHUNK_PX, h3 } from '../surfaces/floor';
import { WALL_CAP_H, WALL_FACE_H } from '../surfaces/walls';
import { asgardDrawBoard, asgardDrawClock, asgardDrawWindowView } from './superficies-janela';
import { asgardRoomTheme } from './superficies-paletas';
import { asgardCapColor, asgardJamb, asgardSouthWallTile, asgardWallFaceTile } from './superficies-paredes';
import { asgardFloorChunk, renderAsgardRug } from './superficies-pisos';
import { asgardDrawScreen } from './superficies-runas';
import { asgardProp } from './superficies-terreno';
import type { SurfaceArt } from './types';

/** Cache com limite simples (descarta tudo ao estourar). */
class Cache<T> {
  private map = new Map<string, T>();
  constructor(private readonly limit: number) {}
  get(key: string, make: () => T): T {
    let v = this.map.get(key);
    if (v === undefined) {
      if (this.map.size >= this.limit) this.map.clear();
      v = make();
      this.map.set(key, v);
    }
    return v;
  }
}

const floorCache = new Cache<HTMLCanvasElement>(1500);
const tileCache = new Cache<HTMLCanvasElement>(2000);
const rugCache = new Cache<HTMLCanvasElement>(512);
const propCache = new Cache<Sprite | null>(128);

function drawFloor(ctx: CanvasRenderingContext2D, kind: FloorKind, x: number, y: number, w: number, h: number, opts: { seed: number; tint?: string; tint2?: string }): void {
  // blocos de 8x8 tiles alinhados à grade do mundo, recortados à área pedida
  const cx0 = Math.floor(x / CHUNK_PX);
  const cy0 = Math.floor(y / CHUNK_PX);
  const cx1 = Math.ceil((x + w) / CHUNK_PX);
  const cy1 = Math.ceil((y + h) / CHUNK_PX);
  // a grama depende do retângulo (sem neve perto das bordas), então ele entra na chave
  const area = kind === 'grass' ? { x, y, w, h } : undefined;
  const ak = area ? `${x},${y},${w},${h}` : '';
  for (let cy = cy0; cy < cy1; cy++) {
    for (let cx = cx0; cx < cx1; cx++) {
      const key = `${kind}|${opts.seed}|${opts.tint ?? ''}|${opts.tint2 ?? ''}|${ak}|${cx}|${cy}`;
      const chunk = floorCache.get(key, () => toCanvas(asgardFloorChunk(kind, cx, cy, opts, area)));
      const px = cx * CHUNK_PX;
      const py = cy * CHUNK_PX;
      const sx = Math.max(0, x - px);
      const sy = Math.max(0, y - py);
      const ex = Math.min(CHUNK_PX, x + w - px);
      const ey = Math.min(CHUNK_PX, y + h - py);
      if (ex <= sx || ey <= sy) continue;
      ctx.drawImage(chunk, sx, sy, ex - sx, ey - sy, px + sx, py + sy, ex - sx, ey - sy);
    }
  }
}

function drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, seed: number): void {
  const rw = Math.max(4, Math.round(w));
  const rh = Math.max(4, Math.round(h));
  const c = rugCache.get(`${rw}|${rh}|${color}|${seed}`, () => toCanvas(renderAsgardRug(rw, rh, color, seed)));
  ctx.drawImage(c, Math.round(x), Math.round(y));
}

function styleKey(s: WallStyle): string {
  return `${s.base}|${s.trim ?? ''}|${s.pattern ?? 'plain'}|${s.exterior ? 1 : 0}`;
}

/** Trechos [x0, x1) da parede que não estão em passagens. */
function solidSegments(x: number, w: number, doorways: readonly Doorway[] | undefined): [number, number][] {
  let segs: [number, number][] = [[x, x + w]];
  for (const d of doorways ?? []) {
    const next: [number, number][] = [];
    for (const [a, b] of segs) {
      if (d.x + d.w <= a || d.x >= b) {
        next.push([a, b]);
        continue;
      }
      if (d.x > a) next.push([a, d.x]);
      if (d.x + d.w < b) next.push([d.x + d.w, b]);
    }
    segs = next;
  }
  return segs;
}

function drawTiled(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, tileFor: (tx: number) => HTMLCanvasElement): void {
  for (let tx = Math.floor(x0 / TILE); tx * TILE < x1; tx++) {
    const px = tx * TILE;
    const sx = Math.max(0, x0 - px);
    const ex = Math.min(TILE, x1 - px);
    if (ex <= sx) continue;
    ctx.drawImage(tileFor(tx), sx, 0, ex - sx, h, px + sx, y, ex - sx, h);
  }
}

function drawWallFace(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, style: WallStyle, opts: { doorways?: Doorway[] } = {}): void {
  const sk = styleKey(style);
  const tileFor = (tx: number) => {
    const col = tx & 3;
    const variant = h3(tx, 0, 7) % 3;
    return tileCache.get(`w|${sk}|${col}|${variant}`, () => toCanvas(asgardWallFaceTile(style, col, variant)));
  };
  const { escuro, claro } = asgardJamb(style);
  const cap = asgardCapColor(style);
  const fh = WALL_FACE_H - WALL_CAP_H;
  for (const [a, b] of solidSegments(x, w, opts.doorways)) {
    drawTiled(ctx, a, b, y, WALL_FACE_H, tileFor);
    // batentes: poste de madeira ou ombreira de pedra nas bordas que encostam numa passagem
    if (b < x + w) {
      ctx.fillStyle = escuro;
      ctx.fillRect(b - 2, y + WALL_CAP_H, 2, fh);
      ctx.fillStyle = claro;
      ctx.fillRect(b - 2, y + WALL_CAP_H, 1, fh);
      ctx.fillStyle = shade(cap, -0.08);
      ctx.fillRect(b - 1, y, 1, WALL_CAP_H);
    }
    if (a > x) {
      ctx.fillStyle = claro;
      ctx.fillRect(a, y + WALL_CAP_H, 1, fh);
      ctx.fillStyle = escuro;
      ctx.fillRect(a + 1, y + WALL_CAP_H, 1, fh);
      ctx.fillStyle = shade(cap, 0.06);
      ctx.fillRect(a, y, 1, WALL_CAP_H);
    }
  }
}

function drawWallTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, style: WallStyle): void {
  const cap = asgardCapColor(style);
  ctx.fillStyle = cap;
  ctx.fillRect(x, y, w, h);
  // emendas da viga (ou juntas da pedra) a cada 32 px ao longo do comprimento
  ctx.fillStyle = shade(cap, -0.06);
  if (h > w) for (let yy = Math.ceil(y / 32) * 32; yy < y + h; yy += 32) ctx.fillRect(x, yy, w, 1);
  else for (let xx = Math.ceil(x / 32) * 32; xx < x + w; xx += 32) ctx.fillRect(xx, y, 1, h);
  ctx.fillStyle = shade(cap, 0.09);
  ctx.fillRect(x, y, w, 1);
  if (w > 2) ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = shade(cap, -0.07);
  if (h > 2) ctx.fillRect(x, y + h - 1, w, 1);
  if (w > 2) ctx.fillRect(x + w - 1, y, 1, h);
}

function drawSouthWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, style: WallStyle, opts: { doorways?: Doorway[] } = {}): void {
  const sk = styleKey(style);
  const tileFor = (tx: number) => {
    const col = tx & 3;
    return tileCache.get(`s|${sk}|${col}`, () => toCanvas(asgardSouthWallTile(style, col)));
  };
  const cap = asgardCapColor(style);
  for (const [a, b] of solidSegments(x, w, opts.doorways)) {
    drawTiled(ctx, a, b, y, TILE, tileFor);
    if (b < x + w) {
      ctx.fillStyle = shade(cap, -0.08);
      ctx.fillRect(b - 1, y, 1, TILE);
    }
    if (a > x) {
      ctx.fillStyle = shade(cap, 0.08);
      ctx.fillRect(a, y, 1, TILE);
    }
  }
}

function propSprite(kind: string, seed: number): Sprite | null {
  const v = ((Math.floor(seed) % 7) + 7) % 7;
  return propCache.get(`${kind}|${v}`, () => {
    const s = asgardProp(kind, v);
    return s ? toSprite(s) : null;
  });
}

export const SUPERFICIES: SurfaceArt = {
  drawFloor,
  drawRug,
  drawWallFace,
  drawWallTop,
  drawSouthWall,
  drawScreen: asgardDrawScreen,
  drawBoard: asgardDrawBoard,
  drawWindowView: asgardDrawWindowView,
  drawClock: asgardDrawClock,
  roomTheme: asgardRoomTheme,
  propSprite,
};
