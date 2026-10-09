// Pisos e tapetes de Asgard (puros). Os pisos saem em blocos de 8x8 tiles a partir de coordenadas de MUNDO, como os
// do Escritório (surfaces/floor.ts): tábuas, lajes, veios e pedras continuam de um bloco para o outro sem emenda.
import { TILE, type FloorKind } from '../api';
import { luminance, mix, parseColor, ramp, shade, type RGBA } from '../core/color';
import { PixelBuf } from '../core/pixbuf';
import { CHUNK_PX, CHUNK_TILES, h3, type FloorOpts } from '../surfaces/floor';

const rgba = (c: string): RGBA => parseColor(c);

function rnd01(a: number, b: number, c: number, seed: number): number {
  return h3(a, b, c, seed) / 4294967296;
}

/** Ruído de valor suave (bilinear) em coordenadas de mundo, 0..1. */
function ruido(x: number, y: number, cell: number, seed: number): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = x / cell - gx;
  const fy = y / cell - gy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = rnd01(gx, gy, 0, seed);
  const b = rnd01(gx + 1, gy, 0, seed);
  const c = rnd01(gx, gy + 1, 0, seed);
  const d = rnd01(gx + 1, gy + 1, 0, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

const NIVEIS = 8;
const nivel = (n: number) => Math.min(NIVEIS - 1, Math.max(0, Math.floor(n * NIVEIS)));
function degrade(a: string, b: string): RGBA[] {
  return Array.from({ length: NIVEIS }, (_, i) => rgba(mix(a, b, i / (NIVEIS - 1))));
}

/** Gera o bloco (cx, cy), em unidades de chunk, de um piso de Asgard. `area` (retângulo do piso) só importa na grama. */
export function asgardFloorChunk(kind: FloorKind, cx: number, cy: number, o: FloorOpts, area?: AreaPiso): PixelBuf {
  const b = new PixelBuf(CHUNK_PX, CHUNK_PX);
  const x0 = cx * CHUNK_PX;
  const y0 = cy * CHUNK_PX;
  switch (kind) {
    case 'wood':
      tabuas(b, x0, y0, o.seed, MADEIRA, 5, 64);
      break;
    case 'carpet':
      tabuas(b, x0, y0, o.seed, tingidas(o.tint, o.tint2), 6, 56);
      break;
    case 'tile_check':
      lajes(b, x0, y0, o.seed, 16, 16, 0, (col, row, hh) => ((col + row) & 1 ? ARDOSIA : ARENITO)[hh % 2], JUNTA_XADREZ);
      break;
    case 'tile_white':
      lajes(b, x0, y0, o.seed, 8, 8, 4, (_c, _r, hh) => BANHO[hh % BANHO.length], JUNTA_BANHO);
      break;
    case 'concrete':
      lajes(b, x0, y0, o.seed, 32, 16, 16, (_c, _r, hh) => CORREDOR[hh % CORREDOR.length], JUNTA_CORREDOR, MUSGO);
      break;
    case 'marble':
      pedraPolida(b, x0, y0, o.seed);
      break;
    case 'grass':
      gramado(b, x0, y0, o.seed, area);
      break;
    case 'sidewalk':
      calcamento(b, x0, y0, o.seed);
      break;
    case 'street':
      terraBatida(b, x0, y0, o.seed);
      break;
    default:
      b.rect(0, 0, CHUNK_PX, CHUNK_PX, '#6c7682');
  }
  return b;
}

// ------------------------------------------------------------------ tábuas (salão e tábuas tingidas)

/** [tom][0 normal, 1 topo, 2 fresta de baixo, 3 veio, 4 emenda, 5 depois da emenda, 6 nó, 7 prego]. */
type Tabuas = readonly (readonly RGBA[])[];
const PREGO = rgba('#2a2a30');

function tabelaTabuas(tons: readonly string[]): Tabuas {
  return tons.map((t) => [...[t, shade(t, 0.04), shade(t, -0.1), shade(t, -0.04), shade(t, -0.14), shade(t, 0.035), shade(t, -0.16)].map(rgba), PREGO]);
}

const MADEIRA_BASE = '#6a4a32';
const MADEIRA = tabelaTabuas([MADEIRA_BASE, '#62442e', '#714f36', '#5c402b']);

const tingidasCache = new Map<string, Tabuas>();
/** Tábuas tingidas com a lã da sala: a madeira escura puxada para tint/tint2. */
function tingidas(tint = '#8e3b2e', tint2?: string): Tabuas {
  const t2 = tint2 ?? shade(tint, -0.04);
  const key = `${tint}|${t2}`;
  let t = tingidasCache.get(key);
  if (!t) {
    t = tabelaTabuas([mix(MADEIRA_BASE, tint, 0.55), mix(MADEIRA_BASE, t2, 0.55), mix(MADEIRA_BASE, tint, 0.45), mix(MADEIRA_BASE, t2, 0.65)]);
    if (tingidasCache.size > 64) tingidasCache.clear();
    tingidasCache.set(key, t);
  }
  return t;
}

/** Tábuas largas (rh px) de `len` px, emendas desencontradas, algumas partidas ao meio, pregos de ferro, veios e nós. */
function tabuas(b: PixelBuf, x0: number, y0: number, seed: number, tab: Tabuas, rh: number, len: number): void {
  for (let py = 0; py < CHUNK_PX; py++) {
    const wy = y0 + py;
    const row = Math.floor(wy / rh);
    const iy = wy - row * rh;
    const off = h3(row, 0, 1, seed) % len;
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + px + off;
      const plank = Math.floor(wx / len);
      let ix = wx - plank * len;
      let ph = h3(row, plank, 2, seed);
      const cut = (ph >>> 26) % 3 === 0 ? 14 + ((ph >>> 16) % (len - 28)) : 0;
      if (cut && ix >= cut) {
        ix -= cut;
        ph = h3(row, plank, 3, seed);
      }
      const t = tab[ph % tab.length];
      let k = 0;
      if (ix === 0) k = 4;
      else if (iy === rh - 1) k = 2;
      else if (iy === 0) k = ix === 1 ? 5 : 1;
      else if (ix === 2 && (iy === 1 || iy === rh - 2)) k = 7;
      else if (iy === 2 && ix === 9 + ((ph >>> 12) % 20) && (ph >>> 20) % 4 === 0) k = 6;
      else if (iy === 1 + ((ph >>> 5) % (rh - 2)) && (ix + (ph >>> 8)) % 17 < 6) k = 3;
      else if (ix === 1) k = 5;
      b.put(px, py, t[k]);
    }
  }
}

// ------------------------------------------------------------------ lajes (cozinha, banho e corredor)

interface Pedra {
  lv: RGBA[];
  hi: RGBA;
  lo: RGBA;
  pinta: RGBA;
}

function pedra(base: string, spread = 0.045): Pedra {
  return { lv: degrade(shade(base, -spread), shade(base, spread)), hi: rgba(shade(base, spread + 0.05)), lo: rgba(shade(base, -spread - 0.06)), pinta: rgba(shade(base, -spread - 0.1)) };
}

const ARDOSIA = [pedra('#646e78'), pedra('#5d6771')];
const ARENITO = [pedra('#a39079'), pedra('#9a8770')];
const JUNTA_XADREZ = rgba('#3b3631');
const BANHO = [pedra('#a7b2b8', 0.03), pedra('#9fabb2', 0.03), pedra('#aeb8bd', 0.03)];
const JUNTA_BANHO = rgba('#76838a');
const CORREDOR = [pedra('#7d8690'), pedra('#76808a'), pedra('#848c95'), pedra('#7f8389')];
const JUNTA_CORREDOR = rgba('#454b52');
const MUSGO = rgba('#56703f');

/** Rachadura fina e torta em ~1 de cada 6 lajes grandes. */
function rachadura(ix: number, iy: number, sw: number, sh: number, hh: number): boolean {
  if (hh % 6 !== 0 || Math.min(sw, sh) < 12) return false;
  const len = Math.min(sw, sh) - 5;
  const x0 = 2 + ((hh >>> 4) % Math.max(1, sw - len - 3));
  const k = ix - x0;
  if (k < 0 || k >= len) return false;
  const slope = ((hh >>> 13) % 3) - 1;
  const yy = 3 + ((hh >>> 9) % Math.max(1, sh - 7)) + Math.trunc((k * slope) / 2);
  return iy === Math.min(sh - 3, Math.max(1, yy));
}

/** Lajes sw x sh em fileiras deslocadas `shift` px: bisel claro em cima/à esquerda, escuro embaixo/à direita, junta e musgo. */
function lajes(
  b: PixelBuf,
  x0: number,
  y0: number,
  seed: number,
  sw: number,
  sh: number,
  shift: number,
  pedraDe: (col: number, row: number, hh: number) => Pedra,
  junta: RGBA,
  musgo?: RGBA,
): void {
  for (let py = 0; py < CHUNK_PX; py++) {
    const wy = y0 + py;
    const row = Math.floor(wy / sh);
    const iy = wy - row * sh;
    const dx = (row & 1) * shift;
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + px + dx;
      const col = Math.floor(wx / sw);
      const ix = wx - col * sw;
      if (ix === sw - 1 || iy === sh - 1) {
        b.put(px, py, musgo && h3(wx, wy, 9, seed) % 9 === 0 ? musgo : junta);
        continue;
      }
      const hh = h3(col, row, 8, seed);
      const p = pedraDe(col, row, hh);
      let c: RGBA;
      if (iy === 0 || ix === 0) c = p.hi;
      else if (iy === sh - 2 || ix === sw - 2) c = p.lo;
      else if (rachadura(ix, iy, sw, sh, hh) || h3(wx, wy, 10, seed) % 37 === 0) c = p.pinta;
      else c = p.lv[nivel(ruido(wx, wy, 9, seed + (hh % 7)) * 0.75 + 0.12)];
      b.put(px, py, c);
    }
  }
}

// ------------------------------------------------------------------ pedra polida (trono e salas de projeto)

const POLIDA = degrade('#9ea7b1', '#b3bbc3');
const POLIDA_ESCURA = degrade('#949da8', '#a8b0b9');
const VEIO_OURO = [rgba('#b98f34'), rgba('#e6c35c')] as const;
const VEIO_CINZA = rgba('#8a939e');
const JUNTA_POLIDA = rgba('#69727c');
const INCRUSTACAO = [rgba('#c9a03e'), rgba('#f3d77e')] as const;
const REFLEXO = rgba('#c4cbd2');

/** Placas 2x2 tiles em xadrez de dois tons, veios dourados em parte delas e ouro incrustado no cruzamento das juntas. */
function pedraPolida(b: PixelBuf, x0: number, y0: number, seed: number): void {
  for (let py = 0; py < CHUNK_PX; py++) {
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + px;
      const wy = y0 + py;
      const sx = wx & 31;
      const sy = wy & 31;
      if (sx === 31 || sy === 31) {
        const dxc = ((wx + 17) & 31) - 16;
        const dyc = ((wy + 17) & 31) - 16;
        const cruz = Math.abs(dxc) + Math.abs(dyc) <= 1 && ((((wx + 17) >> 5) + ((wy + 17) >> 5)) & 1) === 0;
        b.put(px, py, cruz ? INCRUSTACAO[dxc === 0 && dyc === 0 ? 1 : 0] : JUNTA_POLIDA);
        continue;
      }
      const slab = h3(wx >> 5, wy >> 5, 4, seed);
      const tab = ((wx >> 5) + (wy >> 5)) & 1 ? POLIDA_ESCURA : POLIDA;
      let c = tab[nivel(ruido(wx, wy, 20, seed + 11))];
      if ((slab >>> 12) % 5 < 2) {
        const ax = (slab % 1000) / 1000;
        const v = Math.sin(wx * 0.08 + wy * (0.14 + ax * 0.1) + ruido(wx, wy, 14, seed + 12) * 2.4 + ax * 6.28);
        if (v > 0.996) c = VEIO_OURO[1];
        else if (v > 0.985) c = VEIO_OURO[0];
      } else if ((slab >>> 20) % 3 === 0) {
        const v = Math.sin(wy * 0.07 - wx * 0.11 + ruido(wx, wy, 16, seed + 13) * 2.2 + (slab % 628) / 100);
        if (v > 0.993) c = VEIO_CINZA;
      }
      // polimento: dois riscos de reflexo no canto de cima/esquerda de metade das placas
      if ((slab >>> 7) & 1 && (sx + sy === 9 || sx + sy === 12) && sx > 1 && sy > 1 && c !== VEIO_OURO[0] && c !== VEIO_OURO[1]) c = REFLEXO;
      b.put(px, py, c);
    }
  }
}

// ------------------------------------------------------------------ gramado com manchas de neve

const GRAMA = degrade('#4c7440', '#679152');
const NEVE = rgba('#e9eef3');
const NEVE_LUZ = rgba('#f6f9fc');
const NEVE_SOMBRA_CLARA = rgba('#d3dde8');
const NEVE_SOMBRA = rgba('#b6c5d8');
const NEVE_BRILHO = rgba('#ffffff');
const NEVE_MIUDA = rgba('#dfe7ef');
const GRAMA_SOMBRA = rgba('#4a6550');

/** Área do piso em px de mundo (o retângulo pedido ao drawFloor). */
export interface AreaPiso {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Faixa sem neve junto às bordas do gramado e a transição até ela voltar: o mundo amostra o canto do terreno para
 * pintar o fundo além do mapa e escurece a borda com a vinheta, então neve ali vira manchas repetidas e emenda.
 */
const SEM_NEVE = 8 * TILE;
const TRANSICAO = 5 * TILE;
const LIMIAR_NEVE = 0.6;

/**
 * Valor da neve no ponto (neve acima de LIMIAR_NEVE): manchas pequenas (~1 tile), de contorno irregular (ruído
 * fino), só onde o ruído largo de "presença" deixa, e nenhuma perto das bordas da área.
 */
function neve(wx: number, wy: number, seed: number, area?: AreaPiso): number {
  let v = ruido(wx, wy, 14, seed + 31) * 0.76 + ruido(wx, wy, 4, seed + 37) * 0.24 - (1 - ruido(wx, wy, 96, seed + 41)) * 0.5;
  if (area) {
    const d = Math.min(wx - area.x, area.x + area.w - 1 - wx, wy - area.y, area.y + area.h - 1 - wy);
    v -= (1 - Math.min(1, Math.max(0, (d - SEM_NEVE) / TRANSICAO))) * 0.6;
  }
  return v;
}

function gramado(b: PixelBuf, x0: number, y0: number, seed: number, area?: AreaPiso): void {
  // máscara de neve com margem (1 px dos lados e em cima, 2 embaixo): luz, sombra e flocos olham os vizinhos,
  // inclusive os de fora do bloco, então a borda das manchas não emenda errado entre blocos
  const n = CHUNK_PX;
  const mw = n + 2;
  const mask = new Uint8Array(mw * (n + 3));
  for (let py = -1; py <= n + 1; py++) {
    for (let px = -1; px <= n; px++) mask[(py + 1) * mw + px + 1] = neve(x0 + px, y0 + py, seed, area) > LIMIAR_NEVE ? 1 : 0;
  }
  const tem = (px: number, py: number) => mask[(py + 1) * mw + px + 1] === 1;
  for (let py = 0; py < n; py++) {
    for (let px = 0; px < n; px++) {
      const wx = x0 + px;
      const wy = y0 + py;
      if (tem(px, py)) {
        // volume: aresta de cima clara, flanco direito e borda de baixo azulados, miolo com pintas
        const sp = h3(wx, wy, 16, seed) % 61;
        let c = sp === 0 ? NEVE_BRILHO : sp < 5 ? NEVE_SOMBRA_CLARA : NEVE;
        if (!tem(px, py + 1)) c = NEVE_SOMBRA;
        else if (!tem(px, py + 2) || !tem(px + 1, py)) c = NEVE_SOMBRA_CLARA;
        else if (!tem(px, py - 1)) c = NEVE_LUZ;
        b.put(px, py, c);
        continue;
      }
      if (tem(px, py - 1)) {
        // sombra azulada da mancha na grama logo abaixo
        b.put(px, py, GRAMA_SOMBRA);
        continue;
      }
      // flocos soltos em volta da mancha quebram o contorno
      if ((tem(px - 1, py) || tem(px + 1, py) || tem(px, py + 1)) && h3(wx, wy, 18, seed) % 3 === 0) {
        b.put(px, py, NEVE_MIUDA);
        continue;
      }
      const g = ruido(wx, wy, 40, seed + 5) * 0.7 + ruido(wx, wy, 6, seed + 6) * 0.3;
      b.put(px, py, GRAMA[nivel(g)]);
    }
  }
  // tufos, flores e pedrinhas por tile (só fora da neve)
  const livre = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && !tem(x, y);
  for (let ty = 0; ty < CHUNK_TILES; ty++) {
    for (let tx = 0; tx < CHUNK_TILES; tx++) {
      const gx = Math.floor(x0 / TILE) + tx;
      const gy = Math.floor(y0 / TILE) + ty;
      const r = (i: number) => rnd01(gx, gy, i, seed);
      const ox = tx * TILE;
      const oy = ty * TILE;
      for (let i = 0; i < 3; i++) {
        const x = ox + 2 + Math.floor(r(i) * 12);
        const y = oy + 3 + Math.floor(r(i + 10) * 11);
        if (!livre(x, y) || !livre(x, y - 2)) continue;
        b.set(x, y, '#3a5c34');
        b.set(x - 1, y - 1, '#4a6e3e');
        b.set(x + 1, y - 1, '#4a6e3e');
        b.set(x, y - 2, i === 0 ? '#86a85e' : '#6f9452');
      }
      if (r(30) < 0.1) {
        const x = ox + 3 + Math.floor(r(31) * 10);
        const y = oy + 3 + Math.floor(r(32) * 10);
        if (livre(x, y) && livre(x + 1, y)) {
          const c = ['#f2f0e6', '#8d86e0', '#e8c43c', '#d77aa8'][Math.floor(r(33) * 4)];
          b.set(x, y, c);
          b.set(x + 1, y + 1, c);
          b.set(x, y + 1, '#3a5c34');
        }
      }
      if (r(40) < 0.06) {
        const x = ox + 3 + Math.floor(r(41) * 10);
        const y = oy + 3 + Math.floor(r(42) * 10);
        if (livre(x, y) && livre(x + 1, y)) {
          b.set(x, y, '#9aa0a8');
          b.set(x + 1, y, '#7d838c');
          b.set(x, y - 1, '#b8bdc4');
        }
      }
    }
  }
}

// ------------------------------------------------------------------ calçamento da rua e terra batida

const PEDRAS_RUA = ['#8a8d92', '#7f8389', '#94918a', '#86807a'].map((t) => ({ c: rgba(t), hi: rgba(shade(t, 0.07)), lo: rgba(shade(t, -0.09)) }));
const FRESTA = [rgba('#4a4238'), rgba('#3e372f'), rgba('#55613f')] as const;

/** Paralelepípedos arredondados 6x5 em fileiras desencontradas, com terra e musgo nas frestas. */
function calcamento(b: PixelBuf, x0: number, y0: number, seed: number): void {
  const RH = 6;
  const SW = 7;
  for (let py = 0; py < CHUNK_PX; py++) {
    const wy = y0 + py;
    const row = Math.floor(wy / RH);
    const iy = wy - row * RH;
    const off = (row * 3 + (h3(row, 0, 11, seed) % 3)) % SW;
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + px + off;
      const col = Math.floor(wx / SW);
      const ix = wx - col * SW;
      const gap = ix === SW - 1 || iy === RH - 1 || ((ix === 0 || ix === SW - 2) && (iy === 0 || iy === RH - 2));
      if (gap) {
        const hh = h3(wx, wy, 12, seed);
        b.put(px, py, FRESTA[hh % 7 === 0 ? 2 : (hh >>> 3) & 1]);
        continue;
      }
      const p = PEDRAS_RUA[h3(col, row, 14, seed) % PEDRAS_RUA.length];
      b.put(px, py, iy === 0 || ix === 0 ? p.hi : iy === RH - 2 || ix === SW - 2 ? p.lo : p.c);
    }
  }
}

const TERRA = degrade('#6b5640', '#836a4e');
const SULCO = degrade('#5a4836', '#6a5641');
const SEIXO = [rgba('#9a9389'), rgba('#4f4234')] as const;

/** Terra batida com manchas, seixos e dois sulcos de roda a cada 32 px. */
function terraBatida(b: PixelBuf, x0: number, y0: number, seed: number): void {
  for (let py = 0; py < CHUNK_PX; py++) {
    const wy = y0 + py;
    const m = wy & 31;
    const sulco = m === 9 || m === 10 || m === 21 || m === 22;
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + px;
      const sp = h3(wx, wy, 15, seed) % 61;
      if (sp < 2) {
        b.put(px, py, SEIXO[sp]);
        continue;
      }
      const n = ruido(wx, wy, 24, seed) * 0.6 + ruido(wx, wy, 6, seed + 3) * 0.4;
      b.put(px, py, (sulco ? SULCO : TERRA)[nivel(n)]);
    }
  }
}

// ------------------------------------------------------------------ tapetes de lã

const LA_CLARA = '#e9dfc6';
const LA_ESCURA = '#3b2c24';
const FRANJA = '#e6dcc4';
/** Estrela de Selbu (oito pontas), 7x7. */
const ESTRELA = ['#..#..#', '.#.#.#.', '..###..', '###.###', '..###..', '.#.#.#.', '#..#..#'];

/**
 * Tapete de lã: ourela escura, barra em zigue-zague de lã crua, filete e campo com padrão nórdico pela semente
 * (losangos, zigue-zague ou estrelas de Selbu). As franjas ficam nas pontas curtas; tapetes pequenos viram listras.
 */
export function renderAsgardRug(w: number, h: number, color: string, seed: number): PixelBuf {
  const b = new PixelBuf(w, h);
  const m = ramp(color, 0.06);
  const lum = luminance(color);
  const contraste = lum < 0.55 ? LA_CLARA : LA_ESCURA;
  const deitado = w >= h;
  if (deitado) {
    for (let y = 2; y < h - 2; y += 2) {
      b.set(0, y, FRANJA);
      b.set(w - 1, y, FRANJA);
    }
  } else {
    for (let x = 2; x < w - 2; x += 2) {
      b.set(x, 0, FRANJA);
      b.set(x, h - 1, FRANJA);
    }
  }
  const bx0 = deitado ? 1 : 0;
  const by0 = deitado ? 0 : 1;
  const bw = deitado ? w - 2 : w;
  const bh = deitado ? h : h - 2;
  b.rect(bx0, by0, bw, bh, m.dd);
  b.rect(bx0 + 1, by0 + 1, bw - 2, bh - 2, m.dk);
  if (Math.min(bw, bh) >= 12) {
    // barra: zigue-zague de lã crua correndo em volta, entre a ourela e o filete
    const zz = [0, 1, 2, 1];
    for (let x = bx0 + 1; x < bx0 + bw - 1; x++) {
      const d = zz[(x - bx0) & 3];
      b.set(x, by0 + 1 + d, contraste);
      b.set(x, by0 + bh - 2 - d, contraste);
    }
    for (let y = by0 + 4; y < by0 + bh - 4; y++) {
      const d = zz[(y - by0) & 3];
      b.set(bx0 + 1 + d, y, contraste);
      b.set(bx0 + bw - 2 - d, y, contraste);
    }
    // filete de lã crua em volta do campo
    b.rect(bx0 + 4, by0 + 4, bw - 8, 1, contraste);
    b.rect(bx0 + 4, by0 + bh - 5, bw - 8, 1, contraste);
    b.rect(bx0 + 4, by0 + 4, 1, bh - 8, contraste);
    b.rect(bx0 + bw - 5, by0 + 4, 1, bh - 8, contraste);
    campo(b, bx0 + 5, by0 + 5, bw - 10, bh - 10, m, contraste, Math.abs(Math.floor(seed)) % 3);
  } else {
    // capacho: listras de lã atravessando o comprimento
    for (let y = by0 + 1; y < by0 + bh - 1; y++) {
      for (let x = bx0 + 1; x < bx0 + bw - 1; x++) {
        const a = deitado ? x - bx0 : y - by0;
        const k = a % 6;
        b.set(x, y, k === 0 ? contraste : k === 3 ? m.lt : m.base);
      }
    }
  }
  for (const [cx, cy] of [[bx0, by0], [bx0 + bw - 1, by0], [bx0, by0 + bh - 1], [bx0 + bw - 1, by0 + bh - 1]] as const) b.clear(cx, cy);
  return b;
}

function campo(b: PixelBuf, fx: number, fy: number, fw: number, fh: number, m: ReturnType<typeof ramp>, contraste: string, kind: number): void {
  if (fw <= 0 || fh <= 0) return;
  const k = kind === 2 && (fw < 7 || fh < 7) ? 1 : kind;
  const deitado = fw >= fh;
  const ox = Math.floor((fw % 10 >= 7 ? fw % 10 - 7 : fw % 10 + 3) / 2);
  const oy = Math.floor((fh % 10 >= 7 ? fh % 10 - 7 : fh % 10 + 3) / 2);
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      let c = m.base;
      if (k === 0) {
        // losangos encadeados
        const d = Math.abs(((x + 4) % 8) - 4) + Math.abs(((y + 4) % 8) - 4);
        if (d === 4) c = contraste;
        else if (d <= 1) c = m.hi;
        else if (d === 2) c = m.lt;
      } else if (k === 1) {
        // zigue-zague atravessando o comprimento
        const along = deitado ? x : y;
        const cross = deitado ? y : x;
        const v = (along + Math.abs((cross % 8) - 4)) % 8;
        if (v === 0) c = contraste;
        else if (v === 1 || v === 7) c = m.lt;
        else if (v === 4) c = m.dk;
      } else {
        // estrelas de Selbu numa grade de 10 px, com pontinhos entre elas
        const lx = (((x - ox) % 10) + 10) % 10;
        const ly = (((y - oy) % 10) + 10) % 10;
        if (lx < 7 && ly < 7 && ESTRELA[ly][lx] === '#') c = contraste;
        else if (lx === 8 && ly === 8) c = m.hi;
      }
      b.set(fx + x, fy + y, c);
    }
  }
}
