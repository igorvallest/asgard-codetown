// Paredes de Asgard (puras): o padrão do WallStyle escolhe o material e base/trim tingem esse material.
//   plain → troncos empilhados · wood_panel → madeira entalhada (troncos, friso trançado e almofadas de tábua)
//   stripes → aduelas de igreja de madeira com friso de escamas · brick → pedra cinza-azulada irregular
//   tiles → pedra lavrada em blocos · marble → pedra polida com veios de ouro · glass → treliça com vidro de gelo
// Cada tile é uma coluna de 16 px de um desenho que se repete a cada 64 px (col = tx & 3), então pedras, troncos e
// juntas emendam de um tile para o outro; a variante (0..2) só mexe em detalhes de dentro do tile (nós, rachas).
import { TILE, type WallPattern, type WallStyle } from '../api';
import { mix, ramp, shade } from '../core/color';
import { PixelBuf } from '../core/pixbuf';
import { h3 } from '../surfaces/floor';
import { BASEBOARD_H, WALL_CAP_H, WALL_FACE_H } from '../surfaces/walls';

type Material = 'tronco' | 'entalhe' | 'aduela' | 'pedra' | 'lavrada' | 'polida' | 'trelica';

const MATERIAL: Record<WallPattern, Material> = {
  plain: 'tronco',
  wood_panel: 'entalhe',
  stripes: 'aduela',
  brick: 'pedra',
  tiles: 'lavrada',
  marble: 'polida',
  glass: 'trelica',
};

function materialOf(style: WallStyle): Material {
  return MATERIAL[style.pattern ?? 'plain'] ?? 'tronco';
}

function deMadeira(m: Material): boolean {
  return m === 'tronco' || m === 'entalhe' || m === 'aduela' || m === 'trelica';
}

/** Madeira da parede: a cor do estilo puxada para a madeira escura do salão (as cores claras do Escritório viram madeira média). */
function madeira(style: WallStyle): string {
  const w = mix('#563a27', style.base, 0.35);
  return style.exterior ? mix(w, '#6d6a66', 0.25) : w;
}

function pedra(style: WallStyle): string {
  return mix('#68727e', style.base, 0.4);
}

/** Cor da tampa (topo da parede): viga escura nas paredes de madeira, pedra escura nas de pedra. */
export function asgardCapColor(style: WallStyle): string {
  const base = style.exterior ? '#383d45' : deMadeira(materialOf(style)) ? '#2e2119' : '#353b44';
  return mix(base, style.base, 0.12);
}

/** Batente das passagens: poste de madeira ou ombreira de pedra. */
export function asgardJamb(style: WallStyle): { escuro: string; claro: string } {
  const c = deMadeira(materialOf(style)) ? madeira(style) : pedra(style);
  return { escuro: shade(c, -0.16), claro: shade(c, 0.06) };
}

function corRodape(style: WallStyle, m: Material): string {
  const alvo = deMadeira(m) ? '#3a2a1e' : '#454b54';
  return style.trim ? mix(style.trim, alvo, 0.3) : shade(deMadeira(m) ? madeira(style) : pedra(style), -0.18);
}

// ------------------------------------------------------------------ materiais (pintam as linhas fy..fy+fh-1)

const LOG_H = 5;

function troncos(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle, variant: number): void {
  const w = madeira(style);
  const tons = [0, -0.03, 0.015, -0.015, 0.025, -0.02].map((k) => ramp(shade(w, k), 0.05));
  for (let y = 0; y < fh; y++) {
    const li = Math.floor(y / LOG_H);
    const iy = y % LOG_H;
    const r = tons[li % tons.length];
    b.hline(0, TILE - 1, fy + y, [r.hi, r.lt, r.base, r.dk, r.dd][iy]);
    if (iy === LOG_H - 1) continue;
    // topo dos troncos: cada fileira emenda num ponto diferente do trecho de 64 px
    const emenda = (li * 23 + 8) & 63;
    for (let x = 0; x < TILE; x++) {
      const k = (wx0 + x) & 63;
      if (k === emenda) b.set(x, fy + y, r.dd);
      else if (k === ((emenda + 1) & 63)) b.set(x, fy + y, iy === 0 ? r.hi : r.lt);
    }
  }
  const logs = Math.floor(fh / LOG_H);
  if (logs === 0 || variant === 0) return;
  // nó ou racha (a variante decide), sempre dentro do tile
  const hh = h3(wx0, variant, 17);
  const li = hh % logs;
  const kx = 3 + ((hh >>> 4) % 10);
  const ky = fy + li * LOG_H + 2;
  const r = tons[li % tons.length];
  if (variant === 1) {
    b.set(kx, ky, r.dd);
    b.set(kx - 1, ky, r.dk);
    b.set(kx + 1, ky, r.dk);
    b.set(kx, ky - 1, r.lt);
  } else {
    b.hline(kx - 2, kx + 2, ky, r.dk);
    b.set(kx + 3, ky + 1, r.dk);
  }
}

/** Trança do friso entalhado (8 px, 3 linhas). */
const TRANCA = ['.##..##.', '#..##..#', '.##..##.'];

function entalhe(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle, variant: number): void {
  const w = madeira(style);
  const topo = fh >= 20 ? 2 * LOG_H : 0;
  if (topo) troncos(b, fy, topo, wx0, style, variant);
  const f0 = fy + topo;
  const fundo = shade(w, -0.1);
  const fio = shade(w, 0.1);
  b.hline(0, TILE - 1, f0, shade(w, 0.14));
  for (let r = 0; r < 3; r++) {
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      const on = TRANCA[r][wx & 7] === '#';
      // tacha de ouro no vão da trança, a cada 16 px
      b.set(x, f0 + 1 + r, on ? fio : r === 1 && (wx & 15) === 1 ? '#d4ac48' : fundo);
    }
  }
  b.hline(0, TILE - 1, f0 + 4, shade(w, -0.2));
  // almofadas de tábuas verticais embaixo do friso
  const ay = f0 + 5;
  for (let y = ay; y < fy + fh; y++) {
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      const k = wx & 7;
      const tom = shade(w, (wx >> 3) & 1 ? -0.07 : -0.04);
      const c = k === 0 ? shade(tom, -0.12) : k === 1 ? shade(tom, 0.06) : tom;
      b.set(x, y, y === ay ? shade(c, -0.08) : c);
    }
  }
}

function aduelas(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle): void {
  const w = madeira(style);
  const friso = fh >= 16 ? 5 : 0;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      const k = wx & 3;
      const tom = shade(w, ((h3(wx >> 2, 0, 21) % 3) - 1) * 0.025);
      let c = k === 0 ? shade(tom, -0.13) : k === 1 ? shade(tom, 0.06) : k === 3 ? shade(tom, -0.03) : tom;
      if (y < friso) {
        // friso de escamas de dragão: línguas arredondadas de 8 px
        const e = wx & 7;
        if (y === 0) c = shade(w, 0.1);
        else if (y < 3) c = e === 7 ? shade(w, -0.16) : shade(w, 0.04);
        else if (y === 3) c = e === 0 || e === 7 ? c : e === 6 ? shade(w, -0.12) : w;
        else if (e >= 2 && e <= 5) c = shade(w, -0.14);
      }
      b.set(x, fy + y, c);
    }
  }
}

const PEDRA_H = 6;

interface Fiada {
  s0: number;
  rel: number[];
}

/** Fiadas de pedra (ciclos de 64 px): começo deslocado e larguras de 6 a 14 px, sorteados uma vez. */
const FIADAS: readonly Fiada[] = Array.from({ length: 8 }, (_, row) => {
  const rel = [0];
  let at = 0;
  for (let k = 0; ; k++) {
    const w = 6 + 2 * (h3(row, k, 30) % 5);
    if (at + w > 64 - 6) break;
    at += w;
    rel.push(at);
  }
  return { s0: h3(row, 1, 29) % 11, rel };
});

function bloco(row: number, x: number): { k: number; ix: number; bw: number } {
  const f = FIADAS[row & 7];
  const xr = (x - f.s0 + 64) & 63;
  let k = f.rel.length - 1;
  while (f.rel[k] > xr) k--;
  const end = k + 1 < f.rel.length ? f.rel[k + 1] : 64;
  return { k, ix: xr - f.rel[k], bw: end - f.rel[k] };
}

function alvenaria(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle, variant: number): void {
  const st = pedra(style);
  const tons = [0, -0.035, 0.03, -0.015].map((k) => ramp(shade(st, k), 0.05));
  const argamassa = shade(st, -0.24);
  const canto = shade(argamassa, 0.06);
  const musgo = style.exterior ? '#5d7346' : undefined;
  for (let y = 0; y < fh; y++) {
    const row = Math.floor(y / PEDRA_H);
    const iy = y % PEDRA_H;
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      if (iy === PEDRA_H - 1) {
        b.set(x, fy + y, argamassa);
        continue;
      }
      const { k, ix, bw } = bloco(row, wx);
      if (ix === bw - 1) {
        b.set(x, fy + y, argamassa);
        continue;
      }
      const r = tons[h3(row, k, 33) % tons.length];
      let c = r.base;
      if ((ix === 0 || ix === bw - 2) && (iy === 0 || iy === PEDRA_H - 2)) c = canto;
      else if (iy === 0) c = musgo && h3(wx, row, 36) % 4 === 0 ? musgo : r.hi;
      else if (ix === 0) c = r.lt;
      else if (iy === PEDRA_H - 2 || ix === bw - 2) c = r.dk;
      else {
        const sp = h3(wx, y + variant * 97, 34) % 15;
        if (sp === 0) c = r.dk;
        else if (sp === 1) c = r.lt;
      }
      b.set(x, fy + y, c);
    }
  }
}

function lavrada(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle, variant: number): void {
  const st = pedra(style);
  const tons = [0, 0.025, -0.025].map((k) => ramp(shade(st, k), 0.045));
  const junta = shade(st, -0.2);
  for (let y = 0; y < fh; y++) {
    const row = Math.floor(y / 8);
    const iy = y % 8;
    const dx = (row & 1) * 8;
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x + dx;
      const ix = wx & 15;
      if (iy === 7 || ix === 15) {
        b.set(x, fy + y, junta);
        continue;
      }
      const r = tons[h3((wx >> 4) & 3, row, 35) % tons.length];
      let c = r.base;
      if (iy === 0) c = r.hi;
      else if (ix === 0) c = r.lt;
      else if (iy === 6 || ix === 14) c = r.dk;
      else if (ix >= 2 && ix <= 12 && iy >= 2 && iy <= 5 && (ix + iy * 2 + variant) % 5 === 0) c = shade(r.base, -0.025); // marcas do cinzel
      b.set(x, fy + y, c);
    }
  }
}

function polida(b: PixelBuf, fy: number, fh: number, wx0: number, style: WallStyle): void {
  const r = ramp(mix('#59636e', style.base, 0.4), 0.04);
  const junta = shade(r.base, -0.18);
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      const p = wx & 31;
      if (p === 31) {
        b.set(x, fy + y, junta);
        continue;
      }
      // manchas da pedra em blocos de 2x2 e veios de ouro atravessando as placas na diagonal
      const n = h3(wx >> 1, (y >> 1) + 50, 39) % 7;
      let c = y === 0 ? r.hi : p === 0 ? r.lt : n === 0 ? r.dk : n === 1 ? r.lt : r.base;
      const v = Math.sin(wx * 0.19 + y * 0.31 + Math.sin(wx * 0.07 - y * 0.13) * 2.6 + ((wx >> 5) & 1) * 2.1);
      if (v > 0.992) c = '#e6c35c';
      else if (v > 0.975) c = '#b98f34';
      b.set(x, fy + y, c);
    }
  }
  // filete de ouro logo acima do rodapé
  if (fh > 6) {
    b.hline(0, TILE - 1, fy + fh - 3, '#e3c26b');
    b.hline(0, TILE - 1, fy + fh - 2, '#a87d2c');
  }
}

function trelica(b: PixelBuf, fy: number, fh: number, wx0: number): void {
  b.clearRect(0, fy, TILE, fh);
  b.rect(0, fy, TILE, fh, 'rgba(176,206,222,0.30)');
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < TILE; x++) {
      const wx = wx0 + x;
      const p = wx & 31;
      if (p === 0 || p === 1) b.set(x, fy + y, p === 0 ? '#5a3f2b' : '#3f2c1e');
      else if (((wx + y) & 7) === 0 || ((wx - y) & 7) === 0) b.set(x, fy + y, 'rgba(46,38,34,0.85)');
      else if (((wx + y) & 7) === 2 && ((wx - y) & 7) === 6) b.set(x, fy + y, 'rgba(255,255,255,0.3)');
    }
  }
  b.rect(0, fy, TILE, 2, '#4a3424');
  b.hline(0, TILE - 1, fy, '#6a4c34');
  b.hline(0, TILE - 1, fy + fh - 1, '#3f2c1e');
}

function face(b: PixelBuf, m: Material, fy: number, fh: number, wx0: number, style: WallStyle, variant: number): void {
  switch (m) {
    case 'tronco':
      return troncos(b, fy, fh, wx0, style, variant);
    case 'entalhe':
      return entalhe(b, fy, fh, wx0, style, variant);
    case 'aduela':
      return aduelas(b, fy, fh, wx0, style);
    case 'pedra':
      return alvenaria(b, fy, fh, wx0, style, variant);
    case 'lavrada':
      return lavrada(b, fy, fh, wx0, style, variant);
    case 'polida':
      return polida(b, fy, fh, wx0, style);
    case 'trelica':
      return trelica(b, fy, fh, wx0);
  }
}

// ------------------------------------------------------------------ tampa, rodapé e tiles

function tampa(b: PixelBuf, y0: number, hgt: number, wx0: number, style: WallStyle): void {
  const cap = asgardCapColor(style);
  const mad = deMadeira(materialOf(style));
  b.rect(0, y0, TILE, hgt, cap);
  for (let x = 0; x < TILE; x++) {
    const wx = wx0 + x;
    // emenda da viga (madeira) ou junta das pedras da tampa
    if (mad ? (wx & 63) === 47 : (wx & 31) === 31) b.vline(x, y0 + 1, y0 + hgt - 2, shade(cap, -0.08));
    else if (h3(wx, hgt, 37) % (mad ? 6 : 11) === 0) b.set(x, y0 + 1 + (h3(wx, 1, 38) % Math.max(1, hgt - 2)), shade(cap, 0.04));
  }
  b.hline(0, TILE - 1, y0, shade(cap, 0.09));
  b.hline(0, TILE - 1, y0 + hgt - 1, shade(cap, -0.07));
}

function rodape(b: PixelBuf, y0: number, hgt: number, wx0: number, style: WallStyle, m: Material): void {
  const t = corRodape(style, m);
  b.rect(0, y0, TILE, hgt, t);
  b.hline(0, TILE - 1, y0, shade(t, 0.09));
  if (hgt > 2) b.hline(0, TILE - 1, y0 + hgt - 1, shade(t, -0.09));
  for (let x = 0; x < TILE; x++) {
    const wx = wx0 + x;
    if (deMadeira(m)) {
      // tachas: de ouro na madeira entalhada, de ferro nas demais
      if ((wx & 15) === 4) b.set(x, y0 + 1, m === 'entalhe' ? '#d4ac48' : '#2b2a30');
    } else if ((wx & 15) === 15) b.vline(x, y0 + 1, y0 + hgt - 1, shade(t, -0.12));
  }
}

/** Coluna de 16x32 da face da parede norte: tampa, material e rodapé. `col` = tx & 3, `variant` 0..2. */
export function asgardWallFaceTile(style: WallStyle, col: number, variant: number): PixelBuf {
  const b = new PixelBuf(TILE, WALL_FACE_H);
  const m = materialOf(style);
  const wx0 = (col & 3) * TILE;
  const fy = WALL_CAP_H;
  face(b, m, fy, WALL_FACE_H - WALL_CAP_H - BASEBOARD_H, wx0, style, variant);
  // sombra projetada pela tampa
  if (m !== 'trelica') b.hline(0, TILE - 1, fy, 'rgba(18,14,10,0.28)');
  tampa(b, 0, WALL_CAP_H, wx0, style);
  rodape(b, WALL_FACE_H - BASEBOARD_H, BASEBOARD_H, wx0, style, m);
  return b;
}

/** Tile de 16x16 da parede sul: tampa larga e mureta (a treliça vira aduelas: mureta é sempre opaca). */
export function asgardSouthWallTile(style: WallStyle, col: number): PixelBuf {
  const b = new PixelBuf(TILE, TILE);
  const m0 = materialOf(style);
  const m = m0 === 'trelica' ? 'aduela' : m0;
  const wx0 = (col & 3) * TILE;
  const capH = 6;
  const fh = TILE - capH - 2;
  face(b, m, capH, fh, wx0, style, 0);
  b.rect(0, capH, TILE, fh, 'rgba(24,18,30,0.12)');
  b.hline(0, TILE - 1, capH, 'rgba(18,14,10,0.3)');
  tampa(b, 0, capH, wx0, style);
  rodape(b, TILE - 2, 2, wx0, style, m);
  return b;
}
