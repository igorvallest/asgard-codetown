// Pincel dos desenhos por quadro de Asgard (pergaminhos, espelho, quadro de runas, janela e relógio). Mesmas regras de
// art/dynamic.ts: só fillRect com coordenadas inteiras, recortado ao retângulo ativo, sem criar canvas e com custo que
// depende só do tamanho da área (nunca do valor de `t`, que vem de Date.now()).
type Ctx = CanvasRenderingContext2D;

let clipX0 = -Infinity;
let clipY0 = -Infinity;
let clipX1 = Infinity;
let clipY1 = Infinity;

export function recorte(x: number, y: number, w: number, h: number): void {
  clipX0 = x;
  clipY0 = y;
  clipX1 = x + w;
  clipY1 = y + h;
}

export function pinta(ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  const x0 = Math.max(Math.round(x), clipX0);
  const y0 = Math.max(Math.round(y), clipY0);
  const x1 = Math.min(Math.round(x) + Math.round(w), clipX1);
  const y1 = Math.min(Math.round(y) + Math.round(h), clipY1);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.fillStyle = c;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

/** Hash inteiro rápido e determinístico (sem alocação). */
export function h32(a: number, b = 0): number {
  let x = (Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1)) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

export function frac(n: number): number {
  return n - Math.floor(n);
}

// ------------------------------------------------------------------ runas

/** Runas de 3x4 inspiradas no Futhark antigo (também entalhadas na pedra rúnica do terreno). */
export const RUNAS: readonly (readonly string[])[] = [
  ['#.#', '##.', '#..', '#..'], // fehu
  ['##.', '#.#', '#.#', '#.#'], // uruz
  ['#..', '##.', '##.', '#..'], // thurisaz
  ['#..', '##.', '#.#', '#..'], // ansuz
  ['##.', '#.#', '##.', '#.#'], // raido
  ['.#.', '#..', '.#.', '...'], // kaunan
  ['#.#', '.#.', '#.#', '...'], // gebo
  ['#.#', '##.', '#.#', '#.#'], // hagalaz
  ['.#.', '##.', '.##', '.#.'], // naudiz
  ['.#.', '.#.', '.#.', '.#.'], // isaz
  ['.#.', '#.#', '.#.', '.#.'], // tiwaz
  ['#.#', '.#.', '.#.', '.#.'], // algiz
  ['##.', '#.#', '#..', '#..'], // laguz
  ['.#.', '#.#', '.#.', '#.#'], // othala
  ['.##', '.#.', '.#.', '##.'], // eihwaz
  ['#..', '##.', '.##', '..#'], // jera
];

export const RUNA_COUNT = RUNAS.length;
/** Tiwaz, a runa da vitória (o "GOL"/"KO" de Asgard). */
export const RUNA_TIWAZ = 10;

/** Cada runa em trechos contínuos [dx, dy, largura]: poucos fills por runa. */
const TRECHOS: readonly (readonly (readonly [number, number, number])[])[] = RUNAS.map((rows) => {
  const out: [number, number, number][] = [];
  rows.forEach((row, dy) => {
    let k = 0;
    while (k < row.length) {
      if (row[k] !== '#') {
        k++;
        continue;
      }
      let e = k;
      while (e < row.length && row[e] === '#') e++;
      out.push([k, dy, e - k]);
      k = e;
    }
  });
  return out;
});

export function runa(ctx: Ctx, id: number, x: number, y: number, c: string): void {
  for (const [dx, dy, len] of TRECHOS[((id % RUNA_COUNT) + RUNA_COUNT) % RUNA_COUNT]) pinta(ctx, x + dx, y + dy, len, 1, c);
}

/** Runa com auréola (brilho em volta). */
export function runaAcesa(ctx: Ctx, id: number, x: number, y: number, tinta: string, halo: string): void {
  pinta(ctx, x - 1, y - 1, 5, 6, halo);
  runa(ctx, id, x, y, tinta);
}

/** Faixa escura com uma runa grande no meio (vitória, nocaute): o "GOL"/"KO" de Asgard. */
export function estandarte(ctx: Ctx, x: number, y: number, w: number, h: number, id: number, c: string): void {
  const bx = x + Math.floor((w - 3) / 2);
  const by = y + Math.floor((h - 4) / 2);
  pinta(ctx, bx - 3, by - 1, 9, 6, 'rgba(12,16,28,0.78)');
  pinta(ctx, bx - 2, by - 1, 7, 1, 'rgba(255,215,110,0.35)');
  runa(ctx, id, bx, by, c);
}

// ------------------------------------------------------------------ pergaminho

interface Pergaminho {
  fundo: string;
  luz: string;
  sombra: string;
  rolo: string;
  roloLuz: string;
  tinta: string;
  tintaFraca: string;
}

export const PERGAMINHO: Pergaminho = {
  fundo: '#e6d2a0',
  luz: '#f2e3b8',
  sombra: '#cfb47c',
  rolo: '#8f6b3c',
  roloLuz: '#b8915a',
  tinta: '#5b3f24',
  tintaFraca: '#b49a6a',
};

/** Pergaminho apagado: mais escuro e sem brilho (nunca quase preto). */
export const APAGADO: Pergaminho = {
  fundo: '#9a8766',
  luz: '#a69474',
  sombra: '#87745a',
  rolo: '#5e4c35',
  roloLuz: '#76624a',
  tinta: '#7a6850',
  tintaFraca: '#8c7a5c',
};

/** Velino escuro do "terminal" (runas verdes sendo inscritas). */
export const VELINO: Pergaminho = {
  fundo: '#4b3b2b',
  luz: '#5a4835',
  sombra: '#3d3023',
  rolo: '#2e241a',
  roloLuz: '#5e4a36',
  tinta: '#4fae6a',
  tintaFraca: '#6a5a44',
};

/** Fundo do pergaminho com os rolos nas laterais (2 px de rolo em telas largas). */
export function pergaminho(ctx: Ctx, x: number, y: number, w: number, h: number, p: Pergaminho): void {
  pinta(ctx, x, y, w, h, p.fundo);
  pinta(ctx, x, y, w, 1, p.luz);
  pinta(ctx, x, y + h - 1, w, 1, p.sombra);
  pinta(ctx, x, y, 1, h, p.rolo);
  pinta(ctx, x + w - 1, y, 1, h, p.rolo);
  if (w >= 16) {
    pinta(ctx, x + 1, y, 1, h, p.roloLuz);
    pinta(ctx, x + w - 2, y, 1, h, p.sombra);
  }
}

export interface Grade {
  x: number;
  y: number;
  cols: number;
  rows: number;
  /** Largura e altura ocupadas pelas runas. */
  w: number;
  h: number;
}

/** Grade de runas 3x4 (passo 4x5) centrada no pergaminho, fora dos rolos. */
export function grade(x: number, y: number, w: number, h: number): Grade {
  const margem = w >= 16 ? 2 : 1;
  const util = Math.max(3, w - margem * 2);
  const cols = Math.max(1, Math.floor((util + 1) / 4));
  const rows = Math.max(1, Math.floor((h + 1) / 5));
  const gw = cols * 4 - 1;
  const gh = rows * 5 - 1;
  return { x: x + Math.floor((w - gw) / 2), y: y + Math.max(0, Math.floor((h - gh) / 2)), cols, rows, w: gw, h: gh };
}

/** Brilhos das runas acesas: tinta + auréola. */
export const BRILHOS = [
  { tinta: '#1f7fc4', halo: 'rgba(90,190,255,0.30)' }, // azul de gelo
  { tinta: '#b86a0c', halo: 'rgba(255,190,70,0.32)' }, // ouro
  { tinta: '#23884a', halo: 'rgba(80,220,130,0.28)' }, // verde
  { tinta: '#7a3fc0', halo: 'rgba(180,120,255,0.28)' }, // violeta
  { tinta: '#c2361f', halo: 'rgba(255,100,70,0.30)' }, // brasa
] as const;
