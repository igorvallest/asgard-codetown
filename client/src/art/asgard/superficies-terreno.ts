// Terreno externo de Asgard (puro): pinheiros (com e sem neve), bétulas, pedregulhos e pedras com musgo e neve,
// urze, flores silvestres e a pedra rúnica à beira da estrada. Tamanhos e âncoras na ordem dos de
// world/render/props.ts (âncora = centro da base, no chão); os demais tipos ficam com o desenho do mundo.
import { mulberry32 } from '../../../../shared/hash';
import { PixelBuf } from '../core/pixbuf';
import type { BufSprite } from '../core/sprite';
import { RUNAS } from './superficies-pincel';

export const ASGARD_PROPS = ['snowpine', 'pine', 'tree', 'boulder', 'rock', 'bush', 'flowers', 'runestone'] as const;

/** Sprite do elemento do terreno, ou null para os tipos que Asgard não redesenha. `seed` varia o desenho. */
export function asgardProp(kind: string, seed: number): BufSprite | null {
  const v = Math.abs(Math.floor(seed));
  switch (kind) {
    case 'snowpine':
      return pinheiro(v, true);
    case 'pine':
      return pinheiro(v, false);
    case 'tree':
      return betula(v);
    case 'boulder':
      return pedra(v, 26, 18, 7, true);
    case 'rock':
      return pedra(v, 16, 12, 4, false);
    case 'bush':
      return urze(v);
    case 'flowers':
      return flores(v);
    case 'runestone':
      return pedraRunica(v);
    default:
      return null;
  }
}

const NEVE = '#eef3f8';
const NEVE_SOMBRA = '#c8d6e4';
const MUSGO = ['#4f6d3c', '#5d7a45', '#738f52'] as const;

/** Copa/rocha arredondada: união de círculos, luz de cima/esquerda e ruído; `sy` achata na vertical. */
function copa(b: PixelBuf, rng: () => number, cx: number, cy: number, r: number, tones: readonly string[], sy = 1): void {
  const blobs: [number, number, number][] = [[cx, cy, r]];
  for (let i = 0; i < 4; i++) {
    const a = rng() * Math.PI * 2;
    const d = r * (0.35 + rng() * 0.35);
    blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8 * sy, r * (0.55 + rng() * 0.25)]);
  }
  const inside = (x: number, y: number) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) / sy) ** 2 <= br * br);
  for (let y = Math.floor(cy - r * 1.7 * sy); y <= Math.ceil(cy + r * 1.7 * sy); y++) {
    for (let x = Math.floor(cx - r * 1.8); x <= Math.ceil(cx + r * 1.8); x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const light = -((x - cx) / r) * 0.45 - ((y - cy) / (r * sy)) * 0.75 + (rng() - 0.5) * 0.55;
      b.set(x, y, tones[light > 0.55 ? 3 : light > 0.05 ? 2 : light > -0.5 ? 1 : 0]);
    }
  }
}

/** Primeira linha opaca de cada coluna (topo da silhueta), -1 se vazia. */
function topos(b: PixelBuf): number[] {
  return Array.from({ length: b.w }, (_, x) => {
    for (let y = 0; y < b.h; y++) if (b.alpha(x, y) > 0) return y;
    return -1;
  });
}

/** Neve assentada no topo da silhueta (entre as colunas x0 e x1), mais grossa no meio, sombreada à direita. */
function neveNoTopo(b: PixelBuf, x0: number, x1: number, grossura: number): void {
  const top = topos(b);
  const meio = (x0 + x1) / 2;
  for (let x = x0; x <= x1; x++) {
    if (top[x] < 0) continue;
    const g = Math.max(1, Math.round(grossura * (1 - Math.abs(x - meio) / ((x1 - x0) / 2 + 1))));
    for (let k = 0; k < g; k++) b.set(x, top[x] + k, x > meio + 1 ? NEVE_SOMBRA : NEVE);
  }
}

// ------------------------------------------------------------------ pinheiro

function pinheiro(seed: number, nevado: boolean): BufSprite {
  const rng = mulberry32(seed * 7919 + (nevado ? 13 : 0));
  const b = new PixelBuf(28, 48);
  for (let y = 38; y < 46; y++) for (let x = 12; x < 16; x++) b.set(x, y, x === 12 ? '#7a5638' : x === 15 ? '#3e2a1c' : '#5a3e2a');
  const tons = ['#173a2e', '#21503c', '#2c6449', '#3f7e5a'];
  const camadas = 5;
  for (let l = 0; l < camadas; l++) {
    const top = 2 + l * 7;
    const bottom = top + 11 + (l === camadas - 1 ? 1 : 0);
    const halfMax = 3 + l * 2.1;
    for (let y = top; y < bottom; y++) {
      const f = (y - top) / (bottom - top);
      const half = Math.round(f * halfMax + (l === 0 ? 0 : 1.5));
      for (let x = 14 - half; x <= 14 + half; x++) {
        // pontas dos galhos caídas e irregulares na base de cada camada
        if (y === bottom - 1 && (x + l + seed) % 3 === 0) continue;
        const light = ((14 - x) / (half + 1)) * 0.8 - f + (rng() - 0.5) * 0.5;
        b.set(x, y, tons[light > 0.45 ? 3 : light > -0.15 ? 2 : light > -0.65 ? 1 : 0]);
      }
    }
    if (!nevado) continue;
    // neve sobre os galhos: faixa irregular perto da base da camada, mais no lado iluminado
    const sy = bottom - 3;
    const half = Math.round(((sy - top) / (bottom - top)) * halfMax + (l === 0 ? 0 : 1.5));
    for (let x = 14 - half + 1; x <= 14 + half - 1; x++) {
      if ((x + l) % 4 === 0) continue;
      b.set(x, sy, x > 15 ? NEVE_SOMBRA : NEVE);
      if (x < 13 && rng() < 0.6) b.set(x, sy + 1, NEVE);
    }
  }
  if (nevado) {
    b.set(14, 1, NEVE);
    b.hline(13, 15, 2, NEVE);
    b.ellipse(14, 45.5, 6, 1.6, '#e3eaf1');
    b.hline(10, 18, 45, NEVE);
  }
  b.outline();
  b.shadow(14, 45, 9, 3, '#1c2034', 0.25);
  return { buf: b, ax: 14, ay: 45 };
}

// ------------------------------------------------------------------ bétula

function betula(seed: number): BufSprite {
  const rng = mulberry32(seed * 104729 + 7);
  const b = new PixelBuf(36, 48);
  for (let y = 22; y < 46; y++) {
    const dx = Math.round(Math.sin(y * 0.15 + seed) * 0.6);
    for (let x = 17; x < 20; x++) b.set(x + dx, y, x === 17 ? '#f4f1ea' : x === 19 ? '#b9b4a8' : '#e2ddd2');
    // marcas escuras da casca
    if (rng() < 0.3) b.hline(17 + dx, 18 + dx + (rng() < 0.5 ? 1 : 0), y, '#2f2f33');
  }
  b.line(18, 31, 13, 25, '#d8d2c6');
  b.line(19, 29, 24, 23, '#d8d2c6');
  const outono = seed % 3 === 2;
  const tons = outono ? ['#a8702a', '#c98e2e', '#e0b040', '#f2d36a'] : ['#3e6b34', '#557f3e', '#6f9a4a', '#97bf63'];
  // copa em cachos (um em cima, dois embaixo), em vez de uma bola só
  const r0 = 7 + Math.floor(rng() * 2);
  copa(b, rng, 18, 12, r0, tons);
  copa(b, rng, 14, 19, r0 - 2, tons);
  copa(b, rng, 22, 18, r0 - 2, tons);
  // copa rala: alguns furos por onde se vê o céu
  for (let i = 0; i < 4; i++) {
    const x = 12 + Math.floor(rng() * 12);
    const y = 10 + Math.floor(rng() * 12);
    if (b.alpha(x, y) && b.alpha(x - 1, y) && b.alpha(x + 1, y)) b.clear(x, y);
  }
  b.outline();
  b.shadow(18, 45, 11, 3, '#1c2034', 0.24);
  return { buf: b, ax: 18, ay: 45 };
}

// ------------------------------------------------------------------ pedras, urze e flores

function pedra(seed: number, w: number, h: number, r: number, grande: boolean): BufSprite {
  const rng = mulberry32(seed * 31337 + (grande ? 3 : 5));
  const b = new PixelBuf(w, h);
  const cx = w / 2;
  const cy = h - 2 - r * 0.75;
  copa(b, rng, cx, cy, r, ['#5f6874', '#78818c', '#959da7', '#b4bbc3'], 0.75);
  // musgo no lado de cima/esquerda e uma rachadura
  const top = topos(b);
  for (let x = 1; x < w - 1; x++) {
    if (top[x] < 0 || x > cx + 1 || rng() < 0.35) continue;
    b.set(x, top[x] + 1 + Math.floor(rng() * 2), MUSGO[Math.floor(rng() * MUSGO.length)]);
  }
  if (grande) b.line(cx + 1, cy - 1, cx + 3, cy + r * 0.5, '#4f5763');
  if (seed % (grande ? 2 : 3) === 0) neveNoTopo(b, Math.floor(cx - r + 1), Math.ceil(cx + r - 1), grande ? 3 : 2);
  b.outline();
  b.shadow(cx, h - 2, r + 2, grande ? 2.5 : 1.8, '#1c2034', 0.24);
  return { buf: b, ax: Math.floor(cx), ay: h - 2 };
}

function urze(seed: number): BufSprite {
  const rng = mulberry32(seed * 2654435 + 9);
  const b = new PixelBuf(22, 16);
  copa(b, rng, 11, 10, 6, ['#2e4a30', '#3d5d3a', '#4f7046', '#668a55'], 0.75);
  // espigas floridas de urze (roxo e rosa) na metade de cima
  const top = topos(b);
  for (let x = 4; x < 18; x++) {
    if (top[x] < 0 || rng() < 0.3) continue;
    const c = ['#7d4a8c', '#9a5aa8', '#c77fc0'][Math.floor(rng() * 3)];
    b.set(x, top[x], c);
    if (rng() < 0.5) b.set(x, top[x] + 1 + Math.floor(rng() * 3), c);
    if (rng() < 0.25) b.set(x, top[x] - 1, '#e0a8d8');
  }
  b.outline();
  b.shadow(11, 14, 9, 2, '#1c2034', 0.22);
  return { buf: b, ax: 11, ay: 14 };
}

function flores(seed: number): BufSprite {
  const rng = mulberry32(seed * 69069 + 11);
  const b = new PixelBuf(30, 14);
  // tufos de capim
  for (let i = 0; i < 16; i++) {
    const x = 2 + Math.floor(rng() * 26);
    const y = 8 + Math.floor(rng() * 5);
    b.set(x, y, '#3f6a3a');
    b.set(x - 1, y - 1, '#4f7a42');
    b.set(x + 1, y - 1, '#5a8a48');
  }
  // flores do campo: campânulas, margaridas, botões-de-ouro, urze e papoulas
  const cores = ['#8d86e0', '#8d86e0', '#f2f0e6', '#f2f0e6', '#e8c43c', '#d77aa8', '#e8574a'];
  for (let i = 0; i < 18; i++) {
    const x = 3 + Math.floor(rng() * 24);
    const y = 2 + Math.floor(rng() * 8);
    b.vline(x, y + 1, y + 2, '#4a7a3a');
    const c = cores[Math.floor(rng() * cores.length)];
    b.set(x, y, c);
    if (rng() < 0.4) b.set(x + 1, y, c);
  }
  return { buf: b, ax: 15, ay: 13 };
}

// ------------------------------------------------------------------ pedra rúnica

function pedraRunica(seed: number): BufSprite {
  const rng = mulberry32(seed * 40503 + 17);
  const b = new PixelBuf(16, 28);
  const x0 = 3;
  const x1 = 12;
  const yTop = 3;
  const yBot = 25;
  const domo = [3, 2, 1, 1];
  for (let y = yTop; y <= yBot; y++) {
    const inset = domo[y - yTop] ?? 0;
    const xa = x0 + inset;
    const xb = x1 - inset;
    for (let x = xa; x <= xb; x++) {
      let c = x === xa ? '#a3a9b1' : x === xb ? '#5f6670' : x === xb - 1 ? '#767d87' : '#8a9099';
      if (c === '#8a9099' && rng() < 0.07) c = rng() < 0.5 ? '#7d838c' : '#979da5';
      b.set(x, y, c);
    }
  }
  // serpente pintada de vermelho contornando a pedra, cabeça embaixo à direita
  const serp = '#b03a2e';
  const sulco = '#6a2219';
  b.vline(x0 + 1, yTop + 4, yBot - 2, serp);
  b.vline(x1 - 1, yTop + 4, yBot - 3, serp);
  b.vline(x1, yTop + 4, yBot - 3, sulco);
  b.set(x0 + 2, yTop + 3, serp);
  b.set(x1 - 2, yTop + 3, serp);
  b.hline(x0 + 3, x1 - 3, yTop + 2, serp);
  b.hline(x0 + 3, x1 - 3, yTop + 3, sulco);
  b.rect(x1 - 3, yBot - 3, 2, 2, serp);
  b.set(x1 - 3, yBot - 3, '#f2e3b8');
  b.set(x0 + 2, yBot - 2, serp);
  // três runas entalhadas no meio
  for (let i = 0; i < 3; i++) b.stamp(RUNAS[(seed + i * 5) % RUNAS.length], 6, yTop + 6 + i * 5, { '#': '#3f444c' });
  // musgo no pé e, em metade das pedras, neve no topo
  for (let x = x0; x <= x1; x++) if (rng() < 0.5) b.set(x, yBot - (rng() < 0.4 ? 1 : 0), MUSGO[Math.floor(rng() * MUSGO.length)]);
  if (seed % 2 === 0) neveNoTopo(b, x0 + 1, x1 - 1, 2);
  b.outline();
  b.shadow(8, 26, 6, 2, '#1c2034', 0.25);
  return { buf: b, ax: 8, ay: 26 };
}
