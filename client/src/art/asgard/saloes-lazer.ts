// Asgard, salão de lazer: bancos e cadeiras com peles, mesa baixa com chifres de hidromel, mesa de jogo, montes
// de peles, a pedra rúnica de jogo e o espelho de vidência. Mesmas pegadas, assentos e regiões do lounge do
// Escritório (furniture/common.ts e wall.ts).
import { ramp, type Ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, wallSheet, type BufFurniture } from '../core/sprite';
import { contact, rngOf, topFace } from '../furniture/kit';
import { N, blaze, candle, candleFlame, halo, pelt, recess, rune, stud, wallShadow, zigzag } from './saloes-kit';

const W = N.wood;

// ------------------------------------------------------------------ peças de estofado

/** Almofada de couro (cantos arredondados, topo iluminado, costura de luz). */
function cushion(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp, top = 1): void {
  b.rect(x, y, w, h, m.base);
  b.rect(x, y, w, top, m.lt);
  b.hline(x + 1, x + w - 2, y, m.hi);
  b.hline(x, x + w - 1, y + h - 1, m.dk);
  b.vline(x + w - 1, y + 1, y + h - 1, m.dk);
  b.vline(x, y + 1, y + h - 2, m.lt);
  b.set(x, y, m.base);
  b.set(x + w - 1, y, m.dk);
  b.set(x, y + h - 1, m.dk);
}

/** Almofada de lã vermelha com friso dourado. */
function pillow(b: PixelBuf, x: number, y: number, h = 5): void {
  const p = N.red;
  b.rect(x, y, 6, h, p.base);
  b.hline(x + 1, x + 4, y, p.hi);
  b.vline(x, y + 1, y + h - 2, p.lt);
  b.vline(x + 5, y + 1, y + h - 1, p.dk);
  b.hline(x + 1, x + 5, y + h - 1, p.dk);
  b.hline(x + 1, x + 4, y + 2, N.gold.base);
  b.set(x, y, p.lt);
}

/** Braço de tábua maciça (topo arredondado, face com espiral entalhada e remate dourado). */
function boardArm(b: PixelBuf, x: number, top: number, w: number, bottom: number): void {
  b.rect(x, top + 2, w, bottom - top - 2, W.base);
  b.rect(x, top, w, 3, W.lt);
  b.hline(x + 1, x + w - 2, top, W.hi);
  b.hline(x, x + w - 1, top + 3, W.dk);
  b.vline(x, top + 3, bottom, W.lt);
  b.vline(x + w - 1, top + 1, bottom, W.dk);
  b.hline(x, x + w - 1, bottom, W.dd);
  b.clear(x, top);
  b.clear(x + w - 1, top);
  if (w >= 5) {
    // Espiral entalhada na face.
    const cx = x + Math.floor(w / 2);
    const cy = top + 7;
    b.set(cx, cy, W.dd);
    b.set(cx - 1, cy - 1, W.dd);
    b.set(cx, cy - 2, W.dd);
    b.set(cx + 1, cy - 1, W.dd);
    b.set(cx + 1, cy + 1, W.dd);
    b.set(cx - 1, cy + 1, W.lt);
  }
  stud(b, x + Math.floor(w / 2), top + 1);
}

function legs(b: PixelBuf, xs: readonly number[], y: number): void {
  for (const x of xs) {
    b.rect(x, y, 2, 2, N.woodDark.base);
    b.set(x, y, N.woodDark.lt);
  }
}

/** Faixa do assento vista por trás do encosto (couro). */
function backSeat(b: PixelBuf, x0: number, x1: number): void {
  const seat = N.leather;
  b.rect(x0, -3, x1 - x0 + 1, 5, seat.base);
  b.hline(x0, x1, -3, seat.dk);
  b.hline(x0, x1, -2, seat.lt);
}

/**
 * Traseira do encosto (vista de trás, no `front`): tábuas verticais escuras sob uma travessa arredondada e uma
 * pele jogada por cima, caindo pelas costas. Ocupa y = 1..13 (cobre o tronco de quem senta; a cabeça fica à
 * mostra).
 */
function backPanel(f: PixelBuf, x0: number, x1: number, furX: number, furW: number, seed: number): void {
  f.rect(x0, 4, x1 - x0 + 1, 9, W.dk);
  for (let x = x0 + 3; x < x1 - 1; x += 4) f.vline(x, 5, 12, W.dd);
  f.hline(x0, x1, 5, W.base);
  // Travessa de cima (rolo de madeira) e base.
  f.hline(x0 + 1, x1 - 1, 1, W.lt);
  f.hline(x0, x1, 2, W.base);
  f.hline(x0, x1, 3, W.dd);
  f.hline(x0 + 2, x0 + 8, 1, W.hi);
  f.vline(x0, 2, 12, W.base);
  f.vline(x1, 2, 12, W.dd);
  f.hline(x0, x1, 12, W.dd);
  f.hline(x0, x1, 13, N.woodDark.dd);
  // Pele por cima da travessa.
  pelt(f, furX, 1, furW, 5, N.fur, seed);
}

// ------------------------------------------------------------------ sofá e poltrona

/** Banco longo de espaldar alto com peles. 'down' de frente; 'up' de costas (front = encosto). */
export function sofa(variant: string | undefined): BufFurniture {
  const up = variant === 'up';
  const s = floorSheet(3, 1, 18);
  const b = s.buf;
  if (!up) {
    // Espaldar entalhado: travessa com zigue-zague, três painéis rebaixados e montantes com pomo dourado.
    b.rect(4, -13, 40, 15, W.base);
    b.hline(4, 43, -13, W.hi);
    b.hline(4, 43, -12, W.lt);
    zigzag(b, 5, 42, -11, W);
    for (const [x, w] of [[6, 11], [18, 12], [31, 11]] as const) recess(b, x, -7, w, 9, W);
    for (const x of [2, 42]) {
      b.rect(x, -15, 4, 17, W.base);
      b.vline(x, -15, 1, W.lt);
      b.vline(x + 3, -15, 1, W.dk);
      b.hline(x, x + 3, -15, W.hi);
      b.rect(x + 1, -17, 2, 2, N.gold.base);
      b.set(x + 1, -17, N.gold.hi);
    }
    // Pele de lobo jogada no espaldar, cobrindo o painel da esquerda.
    pelt(b, 5, -11, 13, 8, N.fur, 3);
    // Assento: três almofadas de couro, uma delas coberta de pele cinzenta.
    for (let i = 0; i < 3; i++) cushion(b, 6 + i * 12, 2, 12, 7, N.leather, 4);
    pelt(b, 31, 2, 11, 5, N.furGray, 8);
    // Frente do assento entalhada, com tachas.
    b.rect(5, 9, 38, 5, W.dk);
    b.hline(5, 42, 9, W.base);
    zigzag(b, 6, 41, 10, W);
    b.hline(5, 42, 13, W.dd);
    for (let x = 8; x < 42; x += 6) stud(b, x, 9);
    legs(b, [7, 39], 14);
    boardArm(b, 0, -5, 6, 13);
    boardArm(b, 42, -5, 6, 13);
    legs(b, [1, 45], 14);
    pillow(b, 26, -5);
    pillow(b, 35, -4);
    b.outline();
    contact(b, -1, 13, 50, 4, 0.24);
    return { base: s };
  }
  // De costas: base = braços altos + faixa do assento + topo das almofadas; front = traseira do espaldar.
  backSeat(b, 5, 42);
  pillow(b, 8, -3, 4);
  pillow(b, 34, -3, 4);
  boardArm(b, 0, -7, 6, 13);
  boardArm(b, 42, -7, 6, 13);
  b.outline();
  contact(b, -1, 13, 50, 4, 0.24);
  const front = floorSheet(3, 1, 18);
  const f = front.buf;
  backPanel(f, 0, 47, 12, 16, 3);
  legs(f, [2, 23, 44], 14);
  f.outline();
  return { base: s, front };
}

/** Cadeira de espaldar alto com pele. variants como cafe_chair; 'up' tem `front` (encosto visto por trás). */
export function armchair(variant: string | undefined): BufFurniture {
  const v = variant ?? 'down';
  const s = floorSheet(1, 1, 16);
  const b = s.buf;
  if (v === 'down') {
    b.rect(3, -12, 10, 14, W.base);
    b.hline(3, 12, -12, W.hi);
    b.vline(3, -11, 1, W.lt);
    b.vline(12, -11, 1, W.dk);
    recess(b, 5, -9, 6, 9, W);
    b.rect(7, -14, 2, 2, N.gold.base);
    b.set(7, -14, N.gold.hi);
    pelt(b, 4, -10, 8, 6, N.fur, 5);
    cushion(b, 3, 2, 10, 7, N.leather, 4);
    b.rect(3, 9, 10, 5, W.dk);
    b.hline(3, 12, 9, W.base);
    stud(b, 7, 10);
    boardArm(b, 0, -4, 4, 13);
    boardArm(b, 12, -4, 4, 13);
    legs(b, [1, 13], 14);
    b.outline();
    contact(b, -1, 13, 18, 4, 0.24);
    return { base: s };
  }
  if (v === 'up') {
    backSeat(b, 3, 12);
    boardArm(b, 0, -6, 4, 13);
    boardArm(b, 12, -6, 4, 13);
    b.outline();
    contact(b, -1, 13, 18, 4, 0.24);
    const front = floorSheet(1, 1, 16);
    const f = front.buf;
    backPanel(f, 0, 15, 3, 9, 5);
    legs(f, [1, 13], 14);
    f.outline();
    return { base: s, front };
  }
  // Lateral: espaldar do lado oposto ao olhar (com a pele por cima) e o assento de couro na frente.
  const left = v === 'left';
  const bx = left ? 11 : 0;
  cushion(b, 1, 2, 14, 8, N.leather, 5);
  b.rect(1, 9, 14, 5, W.dk);
  b.hline(1, 14, 9, W.base);
  b.rect(bx, -11, 5, 25, W.base);
  b.rect(bx, -11, 5, 2, W.lt);
  b.hline(bx + 1, bx + 3, -11, W.hi);
  b.vline(bx, -9, 13, W.lt);
  b.vline(bx + 4, -9, 13, W.dk);
  b.clear(bx, -11);
  b.clear(bx + 4, -11);
  b.hline(bx, bx + 4, 13, W.dd);
  pelt(b, bx, -8, 5, 6, N.furGray, 9);
  stud(b, bx + 2, 5);
  legs(b, [1, 13], 14);
  b.outline();
  contact(b, -1, 13, 18, 4, 0.24);
  return { base: s };
}

// ------------------------------------------------------------------ mesas

/**
 * Chifre de beber deitado num berço de ferro (8x6), em meia-lua: boca com aro dourado no alto à esquerda, corpo
 * creme que escurece até a ponta, curvada para cima à direita. (x, y) = canto superior esquerdo.
 */
function horn(b: PixelBuf, x: number, y: number, flip = false): void {
  b.stamp(
    ['gG......', 'Dcc....t', '.ccc..ut', '..ccuuu.', '...uuu..', '..I..I..'],
    x,
    y,
    { g: N.gold.base, G: N.gold.hi, D: '#3a2a1e', c: '#efe2c4', u: '#c9a46a', t: '#6e4a2e', I: N.iron.dk },
    flip,
  );
}

/** Jarro de barro com hidromel (bojo, alça e boca). */
function jug(b: PixelBuf, x: number, y: number): void {
  const c = N.clay;
  b.rect(x, y + 2, 5, 5, c.base);
  b.rect(x + 1, y + 1, 3, 1, c.base);
  b.hline(x + 1, x + 3, y, c.lt);
  b.set(x + 2, y, '#5a3a22');
  b.vline(x, y + 2, y + 5, c.lt);
  b.vline(x + 4, y + 2, y + 6, c.dk);
  b.hline(x, x + 4, y + 6, c.dk);
  b.set(x + 1, y + 3, c.hi);
  b.vline(x + 5, y + 2, y + 4, c.dk);
  b.set(x + 5, y + 2, c.base);
}

/** Mesa baixa de tábuas com chifres de hidromel, jarro e petiscos (2 variações). */
export function coffeeTable(seed: number): BufFurniture {
  const s = floorSheet(2, 1, 8);
  const b = s.buf;
  const t = N.plank;
  for (const x of [2, 27]) {
    b.rect(x, 9, 3, 5, W.base);
    b.vline(x, 9, 13, W.lt);
    b.vline(x + 2, 9, 13, W.dk);
  }
  topFace(b, 1, 0, 30, 8, t);
  for (const x of [8, 16, 24]) b.vline(x, 1, 6, t.base);
  b.set(5, 3, t.dk);
  b.set(20, 5, t.dk);
  b.rect(1, 8, 30, 3, W.base);
  zigzag(b, 2, 29, 8, W);
  b.hline(1, 30, 10, W.dd);
  if (seed % 2) {
    horn(b, 3, -1);
    jug(b, 13, -3);
    // Tigela de maçãs e uma vela.
    b.ellipse(21, 3, 3.5, 1.6, W.dk);
    b.ellipse(21, 2.6, 3, 1.1, W.lt);
    for (const [x, y] of [[20, 1], [22, 1], [21, 0]] as const) {
      b.set(x, y, '#c8403a');
      b.set(x + 1, y, '#8e2a26');
    }
    b.set(21, -1, '#4c8a3c');
    candle(b, 27, -2, 4);
  } else {
    horn(b, 2, -1);
    horn(b, 21, -1, true);
    jug(b, 13, -3);
  }
  b.outline();
  if (seed % 2) candleFlame(b, 27, -3);
  contact(b, 0, 12, 32, 4, 0.22);
  return { base: s };
}

/** Mesa de jogo nórdico: tábuas com linhas pintadas a ocre, rede de corda entre postes entalhados. */
export function pingpongTable(): BufFurniture {
  const s = floorSheet(3, 2, 12);
  const b = s.buf;
  const t = ramp('#7d5a3b', 0.06);
  const paint = '#d9ae58';
  // Cavaletes e pé central.
  for (const x of [3, 41]) {
    b.rect(x, 22, 4, 9, W.base);
    b.vline(x, 22, 30, W.lt);
    b.vline(x + 3, 22, 30, W.dk);
    b.hline(x - 1, x + 4, 30, W.dk);
  }
  b.rect(22, 22, 4, 7, W.dk);
  // Tampo de tábuas.
  b.rect(0, -4, 48, 25, t.lt);
  for (const y of [1, 7, 13]) b.hline(0, 47, y, t.base);
  for (const [x, y] of [[9, 3], [33, 10], [15, 16], [40, -1]] as const) b.set(x, y, t.dk);
  // Linhas pintadas: borda, linha do meio e um círculo de runas em cada campo.
  b.hline(0, 47, -4, paint);
  b.hline(0, 47, 19, paint);
  b.vline(0, -4, 19, paint);
  b.vline(47, -4, 19, paint);
  for (let x = 2; x < 46; x += 2) b.set(x, 7, 'rgba(232,196,110,0.8)');
  for (const cx of [11.5, 35.5]) {
    const ring = new Set<string>();
    for (let a = 0; a < 64; a++) {
      const ang = (a / 64) * Math.PI * 2;
      ring.add(`${Math.round(cx + Math.cos(ang) * 5.5)},${Math.round(7 + Math.sin(ang) * 3.6)}`);
    }
    for (const p of ring) {
      const [x, y] = p.split(',').map(Number);
      b.set(x, y, 'rgba(232,196,110,0.5)');
    }
    for (const [dx, dy] of [[0, -2], [-3, 0], [3, 0], [0, 2]] as const) b.set(Math.round(cx) + dx, 7 + dy, 'rgba(232,196,110,0.7)');
  }
  // Frente do tampo (faixa entalhada) e sombra embaixo.
  b.rect(0, 20, 48, 3, W.base);
  zigzag(b, 1, 46, 20, W);
  b.hline(0, 47, 22, W.dd);
  for (let x = 4; x < 46; x += 8) stud(b, x, 20);
  // Rede de corda (corre norte-sul no meio), com altura, entre dois postes entalhados.
  for (let y = -8; y <= 18; y++) {
    b.set(23, y, y % 2 ? '#d8bd8a' : '#8f6d48');
    b.set(24, y, y % 2 ? 'rgba(60,40,24,0.45)' : 'rgba(216,189,138,0.5)');
  }
  b.hline(22, 25, -9, '#c8a878');
  for (const y of [-12, 17]) {
    b.rect(22, y, 4, 4, W.base);
    b.vline(22, y, y + 3, W.lt);
    b.vline(25, y, y + 3, W.dk);
    b.hline(23, 24, y - 1, N.gold.base);
    b.set(23, y - 1, N.gold.hi);
  }
  b.outline();
  contact(b, 0, 27, 48, 5, 0.22);
  return { base: s };
}

/**
 * Monte de peles (no lugar do pufe): uma pele grande no chão, outra dobrada por cima e uma almofada de lã. A cor
 * da variante vem da pele de baixo e da lã: raposa (red), lobo (blue), lince (yellow) e urso com lã verde (green).
 */
const PILE: Readonly<Record<string, { under: Ramp; over: Ramp; wool: string; spots?: boolean }>> = {
  red: { under: ramp('#b8582e', 0.07), over: N.fur, wool: '#9c3a2e' },
  blue: { under: N.furGray, over: ramp('#5f6672', 0.065), wool: '#3e5f8a' },
  yellow: { under: ramp('#c9a24f', 0.07), over: N.fur, wool: '#c99a32', spots: true },
  green: { under: N.furBrown, over: N.furGray, wool: '#4f7a46' },
};

/** Pele em monte: elipse de borda esfarrapada (tufos), mechas, topo iluminado e base escura. */
function furMound(b: PixelBuf, cx: number, cy: number, rx: number, ry: number, m: Ramp, seed: number): void {
  const r = rngOf(seed, 47);
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      // Borda irregular: alguns pixels a mais (tufos) e a menos (falhas).
      const jag = ((((x * 7 + y * 13 + seed) % 3) + 3) % 3) / 10 - 0.1;
      if (d > 1 + jag) continue;
      const c = ny < -0.45 ? m.lt : ny > 0.55 ? m.dk : m.base;
      b.set(x, y, c);
    }
  }
  for (let i = 0; i < Math.round(rx * ry * 0.6); i++) {
    const x = Math.round(cx - rx * 0.8 + r() * rx * 1.6);
    const y = Math.round(cy - ry * 0.6 + r() * ry * 1.3);
    if (b.alpha(x, y) === 0) continue;
    b.set(x, y, r() < 0.5 ? m.hi : m.dd);
  }
}

export function beanbag(variant: string | undefined): BufFurniture {
  const p = PILE[variant ?? 'red'] ?? PILE.red;
  const wool = ramp(p.wool, 0.08);
  const s = floorSheet(1, 1, 8);
  const b = s.buf;
  // Almofada de lã listrada atrás.
  b.rect(1, 3, 7, 4, wool.base);
  b.hline(2, 6, 3, wool.lt);
  b.hline(1, 7, 5, wool.dk);
  b.set(1, 3, wool.dk);
  // Pele de baixo, larga, com tufos caindo na frente.
  furMound(b, 8, 10, 7.6, 3.8, p.under, 3);
  for (const x of [3, 7, 11]) b.set(x, 14, p.under.dk);
  if (p.spots) for (const [x, y] of [[3, 10], [6, 12], [10, 9], [13, 11], [8, 13]] as const) b.set(x, y, '#6a4a26');
  // Pele dobrada por cima, com a sombra da dobra.
  furMound(b, 7.5, 7.5, 5.4, 2.6, p.over, 8);
  b.hline(3, 11, 10, p.under.dd);
  b.outline();
  contact(b, 0, 12, 16, 4, 0.24);
  return { base: s };
}

// ------------------------------------------------------------------ fogueira

/**
 * Fogueira de pedra no chão do salão (2x2): anel de pedras, toras cruzadas sobre a cinza, brasas e labaredas
 * altas. rects.glow = centro do fogo (o mundo acende a luz ali, como na luminária).
 */
export function hearth(): BufFurniture {
  const s = floorSheet(2, 2, 16);
  const b = s.buf;
  const st = N.stone;
  const cx = 16;
  const cy = 19;
  // Fosso de cinza e as toras cruzadas.
  b.ellipse(cx, cy, 11, 6.5, '#3a302c');
  b.ellipse(cx, cy + 0.6, 9, 5, '#4a3c34');
  b.line(9, 22, 22, 16, '#5e4029', 2);
  b.line(10, 16, 23, 22, '#7a5436', 2);
  b.rect(9, 22, 2, 2, '#d2a46a');
  b.rect(22, 21, 2, 2, '#d2a46a');
  // Anel de pedras: as de trás primeiro (mostram o topo), as da frente por último (mostram a face).
  const ring: [number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.11;
    ring.push([cx + Math.cos(a) * 13, cy + Math.sin(a) * 8.6]);
  }
  ring.sort((p, q) => p[1] - q[1]);
  ring.forEach(([x, y], i) => {
    const px = Math.round(x - 2.5);
    const py = Math.round(y - 2);
    const front = y > cy;
    const m = i % 3 === 0 ? N.slate : st;
    b.rect(px, py, 5, front ? 5 : 4, m.base);
    b.hline(px + 1, px + 3, py, m.hi);
    b.hline(px, px + 4, py + 1, m.lt);
    b.hline(px, px + 4, py + (front ? 4 : 3), m.dk);
    b.vline(px + 4, py + 1, py + (front ? 4 : 3), m.dk);
    b.clear(px, py);
    b.clear(px + 4, py);
  });
  b.outline();
  contact(b, 1, 25, 30, 6, 0.24);
  // Fogo (depois do contorno): luz quente nas pedras, brasas, labaredas e faíscas.
  halo(b, cx, cy - 3, 17, '#ff9a3c', 0.32);
  for (const [x, y] of [[11, 19], [13, 21], [19, 21], [21, 18], [15, 22], [18, 17]] as const) b.set(x, y, '#ff7a2a');
  b.set(14, 20, '#ffd25a');
  blaze(b, cx, cy + 1, 12, 15, 3);
  blaze(b, cx - 3, cy + 1, 5, 8, 9);
  blaze(b, cx + 3.5, cy + 1, 5, 9, 4);
  for (const [x, y, a] of [[13, 2, 0.8], [19, 0, 0.7], [16, -2, 0.55], [21, 4, 0.6]] as const) b.set(x, y, `rgba(255,214,110,${a})`);
  s.rects = { glow: rectAt(s, cx - 4, cy - 10, 8, 8) };
  return { base: s };
}

// ------------------------------------------------------------------ pedra rúnica e espelho de vidência

/** Pedra rúnica de jogo: laje de pedra com a serpente pintada na borda, face polida (tela) e runas-botão. */
export function arcade(): BufFurniture {
  const s = floorSheet(1, 1, 26);
  const b = s.buf;
  const st = N.stone;
  const snake = '#b5432e';
  const snakeDk = '#7e2a20';
  // Laje com topo arredondado.
  b.rect(0, -22, 16, 36, st.base);
  b.vline(0, -20, 13, st.lt);
  b.vline(1, -21, 13, st.lt);
  b.vline(15, -20, 13, st.dk);
  b.hline(2, 13, -23, st.lt);
  b.hline(3, 12, -24, st.hi);
  for (const [x, y] of [[0, -22], [0, -21], [1, -22], [15, -22], [15, -21], [14, -22]] as const) b.clear(x, y);
  for (const [x, y] of [[2, -23], [13, -23]] as const) b.set(x, y, st.lt);
  for (const [x, y] of [[5, 6], [11, 2], [9, 10], [4, -2], [12, 9]] as const) b.set(x, y, st.dk);
  // Serpente rúnica pintada a vermelho, acompanhando a borda (cabeça embaixo à esquerda, cauda à direita).
  for (let y = -19; y <= 11; y++) {
    b.set(1, y, snake);
    b.set(2, y, snakeDk);
    b.set(13, y, snakeDk);
    b.set(14, y, snake);
    if (y % 3 === 0) {
      b.set(2, y, '#e8a090');
      b.set(13, y, '#e8a090');
    }
  }
  b.hline(3, 12, -22, snake);
  b.hline(3, 12, -21, snakeDk);
  b.set(2, -21, snake);
  b.set(13, -21, snake);
  b.set(2, -20, snake);
  b.set(13, -20, snake);
  b.rect(0, 11, 4, 3, snake);
  b.set(1, 12, '#f2d27a');
  b.set(3, 13, snakeDk);
  b.line(14, 11, 12, 13, snake);
  // Face polida (a tela do jogo): obsidiana com uma runa acesa no meio.
  const screen = { x: 3, y: -17, w: 10, h: 7 };
  b.rect(screen.x, screen.y, screen.w, screen.h, '#1b2131');
  b.hline(screen.x, screen.x + screen.w - 1, screen.y, '#2a3348');
  rune(b, 6, -16, 3, '#59c9d9');
  rune(b, 9, -15, 0, '#3a8a9a');
  // Saliência de controles: runas-botão (âmbar e ciano) e a alavanca de pedra.
  topFace(b, 0, -8, 16, 2, st);
  b.hline(0, 15, -6, st.dk);
  b.hline(0, 15, -5, st.dd);
  b.rect(3, -11, 1, 3, N.iron.base);
  b.rect(2, -12, 3, 2, st.lt);
  b.set(2, -12, st.hi);
  for (const [x, c] of [[8, '#f2b84a'], [10, '#59c9d9'], [12, '#f2b84a']] as const) {
    b.set(x, -8, c);
    b.set(x, -7, '#3a3f4b');
  }
  // Runa grande entalhada e a fenda das moedas.
  rune(b, 6, -2, 3, st.dd);
  b.rect(6, 6, 4, 1, '#2a2e38');
  b.set(8, 5, N.gold.hi);
  // Base de pedra.
  b.rect(-1, 12, 18, 3, N.slate.base);
  b.hline(-1, 16, 12, N.slate.lt);
  b.hline(-1, 16, 14, N.slate.dk);
  b.outline();
  contact(b, -1, 13, 18, 4, 0.26);
  halo(b, 7.5, -13.5, 6, '#59c9d9', 0.18);
  s.rects = { screen: rectAt(s, screen.x, screen.y, screen.w, screen.h) };
  return { base: s };
}

/** Espelho de vidência: moldura de ouro com o olho de Odin, vidro de névoa e velas nas pontas. rects.tv = vidro. */
export function tv(): BufFurniture {
  const s = wallSheet(2);
  const b = s.buf;
  const g = N.gold;
  const x = 1;
  const y = -27;
  const w = 30;
  const h = 20;
  // Prateleira com as velas.
  b.rect(-2, y + h, w + 6, 2, W.lt);
  b.hline(-2, w + 3, y + h, W.hi);
  b.hline(-2, w + 3, y + h + 1, W.dk);
  candle(b, -1, y + h - 5, 5);
  candle(b, w + 1, y + h - 5, 5);
  // Moldura dourada (dois tons, com cantos de pedras).
  b.rect(x, y, w, h, g.base);
  b.hline(x, x + w - 1, y, g.hi);
  b.vline(x, y, y + h - 1, g.lt);
  b.vline(x + w - 1, y, y + h - 1, g.dk);
  b.hline(x, x + w - 1, y + h - 1, g.dk);
  b.rect(x + 1, y + 1, w - 2, h - 2, g.dk);
  for (let i = x + 3; i < x + w - 3; i += 3) {
    b.set(i, y + 1, g.lt);
    b.set(i + 1, y + h - 2, g.base);
  }
  for (const [cx, cy, c] of [[x + 1, y + 1, '#c8403a'], [x + w - 2, y + 1, '#c8403a'], [x + 1, y + h - 2, '#4a86c8'], [x + w - 2, y + h - 2, '#4a86c8']] as const) b.set(cx, cy, c);
  // Vidro: névoa índigo em espiral, com faíscas.
  const gx = x + 2;
  const gy = y + 2;
  const gw = w - 4;
  const gh = h - 5;
  b.rect(gx, gy, gw, gh, '#1a2036');
  b.ellipse(gx + gw / 2, gy + gh / 2, 9, 5, '#212a45');
  b.ellipse(gx + gw / 2, gy + gh / 2, 6, 3, '#2a3658');
  b.ellipse(gx + gw / 2 + 1, gy + gh / 2, 3, 1.5, '#3b4b78');
  b.line(gx + 3, gy + gh - 3, gx + 9, gy + 2, 'rgba(160,190,255,0.12)');
  for (const [px, py] of [[4, 3], [20, 2], [17, 10], [7, 11], [23, 8]] as const) b.set(gx + px, gy + py, 'rgba(190,210,255,0.7)');
  // Olho de Odin no alto da moldura.
  const ex = x + w / 2 - 3;
  b.rect(ex, y - 1, 6, 3, g.base);
  b.hline(ex + 1, ex + 4, y - 1, g.hi);
  b.hline(ex + 1, ex + 4, y, '#f4efe2');
  b.set(ex + 2, y, '#3a6ab0');
  b.set(ex + 3, y, '#1f2a44');
  b.outline();
  wallShadow(b, x - 1, y - 2, w + 2, h + 4);
  candleFlame(b, -1, y + h - 6);
  candleFlame(b, w + 1, y + h - 6);
  s.rects = { tv: rectAt(s, gx, gy, gw, gh) };
  return { base: s };
}
