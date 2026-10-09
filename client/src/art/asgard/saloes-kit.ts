// Kit dos salões de Asgard (puro): materiais nórdicos e os detalhes pequenos que se repetem nos móveis — runas,
// entalhes, cintas de ferro, peles, velas e fogo. Mesma convenção 3/4 do Escritório (furniture/kit.ts): topo
// claro com aresta frontal brilhante, frente em base/dk, luz de cima/esquerda e contorno automático no fim.
// Fogo, brilho e vapor são desenhados DEPOIS do contorno (luz não tem borda).
import { ramp, withAlpha, type Ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { rngOf } from '../furniture/kit';

export const N = {
  /** Madeira escura entalhada (corpo dos móveis). */
  wood: ramp('#5f412d', 0.07),
  /** Madeira mais funda (pés, rodapés, frestas). */
  woodDark: ramp('#45302a', 0.06),
  /** Tábuas gastas, mais claras (tampos, assentos, divisórias). */
  plank: ramp('#8a6443', 0.065),
  /** Pedra cinza-azulada. */
  stone: ramp('#8e98a4', 0.055),
  /** Pedra escura (ardósia). */
  slate: ramp('#68727f', 0.06),
  iron: ramp('#5d636f', 0.08),
  gold: ramp('#d6a441', 0.085),
  bronze: ramp('#b5793f', 0.075),
  leather: ramp('#8a5532', 0.07),
  /** Peles: lobo claro, lobo cinzento e urso. */
  fur: ramp('#cdbfa6', 0.06),
  furGray: ramp('#8f96a1', 0.065),
  furBrown: ramp('#7b5b41', 0.07),
  clay: ramp('#b46b48', 0.07),
  /** Tecido vermelho (almofadas, estandartes; o mesmo tom do tapete do trono). */
  red: ramp('#8e2433', 0.07),
} as const;

/** Água de bacias e cubas. */
export const WATER = { base: '#4f7f9f', lt: '#7fb0cc', hi: '#c4e3f0', dk: '#3c6582' } as const;

/** Remove o contorno lateral (x = -1 e x = w) de módulos que se encaixam lado a lado, como as bancadas. */
export function seamless(b: PixelBuf, w = 16): void {
  for (let y = -b.oy; y < b.h - b.oy; y++) {
    b.clear(-1, y);
    b.clear(w, y);
  }
}

/** Sombra suave projetada na parede (abaixo/direita de um item de parede). */
export function wallShadow(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  for (let yy = y + 1; yy <= y + h; yy++) b.under(x + w, yy, 'rgba(30,34,52,0.16)');
  for (let xx = x + 1; xx <= x + w; xx++) b.under(xx, y + h, 'rgba(30,34,52,0.16)');
}

// ------------------------------------------------------------------ runas e entalhes

/** Runas de 3 px de largura (ᛏ ᛉ ᚱ ᛟ ᚦ ᛗ ᛚ ᚲ). */
const RUNES: readonly (readonly string[])[] = [
  ['.#.', '#.#', '.#.', '.#.'],
  ['#.#', '.#.', '.#.', '.#.'],
  ['##.', '#.#', '##.', '#.#'],
  ['.#.', '#.#', '.#.', '#.#'],
  ['#..', '##.', '##.', '#..'],
  ['#.#', '###', '#.#', '#.#'],
  ['##.', '#.#', '#..', '#..'],
  ['..#', '.#.', '..#', '...'],
];

/** Uma runa (3x4) na cor dada; `i` escolhe qual. */
export function rune(b: PixelBuf, x: number, y: number, i: number, c: string): void {
  b.stamp(RUNES[((i % RUNES.length) + RUNES.length) % RUNES.length], x, y, { '#': c });
}

/** Fileira de runas (passo de 4 px) de x até x + w, sorteadas pela semente. */
export function runeRow(b: PixelBuf, x: number, y: number, w: number, c: string, seed: number): void {
  const r = rngOf(seed, 13);
  for (let xx = x; xx + 3 <= x + w; xx += 4) rune(b, xx, y, Math.floor(r() * RUNES.length), c);
}

/** Faixa entalhada em zigue-zague (3 px de altura): sulco escuro com o fio de luz logo acima. */
export function zigzag(b: PixelBuf, x0: number, x1: number, y: number, m: Ramp): void {
  const wave = [2, 1, 0, 1];
  for (let x = x0; x <= x1; x++) {
    const dy = wave[(x - x0) % 4];
    b.set(x, y + dy, m.dd);
    if (dy > 0) b.set(x, y + dy - 1, m.lt);
  }
}

/** Painel rebaixado (almofada entalhada): fundo escuro, sombra no alto/esquerda e luz embaixo/direita. */
export function recess(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp): void {
  b.rect(x, y, w, h, m.dk);
  b.hline(x, x + w - 1, y, m.dd);
  b.vline(x, y, y + h - 1, m.dd);
  b.hline(x + 1, x + w - 1, y + h - 1, m.lt);
  b.vline(x + w - 1, y + 1, y + h - 1, m.lt);
}

/** Tábuas verticais: costuras escuras a cada `step` px com o fio claro ao lado e um nó aqui e ali. */
export function planks(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp, seed: number, step = 4): void {
  const r = rngOf(seed, 29);
  for (let xx = x + step; xx < x + w - 1; xx += step) {
    b.vline(xx, y, y + h - 1, m.dk);
    b.vline(xx + 1, y, y + h - 1, m.lt);
  }
  for (let k = 0; k < Math.max(1, Math.floor((w * h) / 90)); k++) {
    b.set(x + 1 + Math.floor(r() * (w - 2)), y + 1 + Math.floor(r() * (h - 2)), m.dd);
  }
}

// ------------------------------------------------------------------ ferro, ouro e couro

/** Cinta de ferro horizontal (2 px) com rebites. */
export function strap(b: PixelBuf, x0: number, x1: number, y: number, every = 4): void {
  b.hline(x0, x1, y, N.iron.lt);
  b.hline(x0, x1, y + 1, N.iron.dk);
  for (let x = x0 + 1; x < x1; x += every) b.set(x, y, N.iron.hi);
}

/** Argola de ferro (puxador) 3x3 pendurada em (x, y). */
export function ring(b: PixelBuf, x: number, y: number): void {
  b.set(x + 1, y, N.iron.hi);
  b.set(x, y + 1, N.iron.lt);
  b.set(x + 2, y + 1, N.iron.dk);
  b.set(x + 1, y + 2, N.iron.dd);
}

/** Tacha dourada (1 px brilhante com sombra embaixo). */
export function stud(b: PixelBuf, x: number, y: number): void {
  b.set(x, y, N.gold.hi);
  b.set(x, y + 1, N.gold.dk);
}

// ------------------------------------------------------------------ peles

/**
 * Pele estendida (retângulo) com mechas, topo iluminado e borda de baixo esfarrapada (tufos de 1–2 px abaixo
 * de y + h). Para pele dobrada sobre um encosto, desenhe por cima da madeira.
 */
export function pelt(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp, seed: number): void {
  const r = rngOf(seed, 23);
  b.rect(x, y, w, h, m.base);
  b.hline(x, x + w - 1, y, m.lt);
  if (h > 2) b.hline(x + 1, x + w - 2, y + 1, m.lt);
  for (let i = 0; i < Math.ceil((w * h) / 6); i++) {
    const px = x + Math.floor(r() * w);
    const py = y + 1 + Math.floor(r() * Math.max(1, h - 1));
    const light = r() < 0.45;
    b.set(px, py, light ? m.hi : m.dk);
    if (py + 1 < y + h) b.set(px, py + 1, light ? m.lt : m.base);
  }
  b.vline(x + w - 1, y + 1, y + h - 1, m.dk);
  for (let xx = x; xx < x + w; xx++) {
    const k = Math.floor(r() * 3);
    b.set(xx, y + h - 1, m.dk);
    if (k > 0) b.set(xx, y + h, xx % 2 ? m.dk : m.base);
    if (k > 1) b.set(xx, y + h + 1, m.dd);
  }
}

// ------------------------------------------------------------------ luz

/** Vela de sebo (corpo creme com escorrido); a chama vem depois do contorno com `candleFlame`. */
export function candle(b: PixelBuf, x: number, y: number, h: number): void {
  b.rect(x, y, 2, h, '#eadcb8');
  b.vline(x + 1, y, y + h - 1, '#c9b48a');
  b.set(x, y, '#fff4d6');
  b.set(x, y + 1, '#fff4d6');
  b.set(x + 1, y - 1, '#4a3a2e');
}

/** Chama de vela (2x3) com halo quente, para depois do contorno; (x, y) = base da chama. */
export function candleFlame(b: PixelBuf, x: number, y: number): void {
  halo(b, x + 0.5, y - 1.5, 4, '#ffb347', 0.22);
  b.set(x, y, '#ff8a2a');
  b.set(x, y - 1, '#ffd25a');
  b.set(x, y - 2, '#fff6c8');
}

/**
 * Fogo vivo (para depois do contorno) com base de brasas em (x0..x1, y): línguas de altura variável, núcleo
 * amarelo e pontas claras. `power` 0 = só brasas; 1 = fogo alto.
 */
export function fire(b: PixelBuf, x0: number, x1: number, y: number, power: number, seed: number): void {
  const r = rngOf(seed, 31);
  for (let x = x0; x <= x1; x++) {
    b.set(x, y, r() < 0.5 ? '#c2412a' : '#e0602e');
    if (power <= 0) {
      if (r() < 0.4) b.set(x, y, '#ff8a3a');
      continue;
    }
    const edge = Math.min(x - x0, x1 - x);
    const hgt = Math.max(1, Math.round((1 + edge * 1.2 + r() * 2) * power));
    for (let k = 1; k <= hgt; k++) {
      const t = k / hgt;
      b.set(x, y - k, t < 0.35 ? '#ffd24a' : t < 0.75 ? '#ff9a32' : '#e8552c');
    }
    if (hgt > 2) b.set(x, y - 1, '#fff2b0');
  }
}

/**
 * Labareda de fogueira (para depois do contorno): línguas de altura variável dentro de um envelope em gota,
 * núcleo amarelo-claro embaixo e pontas avermelhadas. (cx, base) = centro da base; w x h = tamanho máximo.
 */
export function blaze(b: PixelBuf, cx: number, base: number, w: number, h: number, seed: number): void {
  const r = rngOf(seed, 37);
  const half = w / 2;
  for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
    const u = (x + 0.5 - cx) / half;
    if (Math.abs(u) >= 1) continue;
    const env = Math.pow(1 - u * u, 0.7);
    const tongue = 0.7 + 0.3 * Math.abs(Math.sin(x * 1.3 + seed));
    const hh = Math.max(1, Math.round(h * env * tongue * (0.85 + r() * 0.3)));
    for (let k = 0; k < hh; k++) {
      // Núcleo em gota (mais largo embaixo), corpo laranja e as pontas de cada língua avermelhadas.
      const t = k / h;
      const a = Math.abs(u);
      const c =
        t / 0.28 + a * 2.2 < 1 ? '#fff4c2' : t / 0.55 + a * 1.3 < 1 ? '#ffd84a' : k >= hh - 2 ? '#e0542a' : k / hh < 0.55 ? '#ffb43a' : '#ff8a2e';
      b.set(x, base - k, c);
    }
  }
}

/** Halo de luz (disco de alfa decrescente) composto por cima; para depois do contorno. */
export function halo(b: PixelBuf, cx: number, cy: number, r: number, c: string, alpha: number): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
      if (d >= 1) continue;
      b.set(x, y, withAlpha(c, alpha * (1 - d) * (1 - d)));
    }
  }
}
