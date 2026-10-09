// Móveis de apoio das salas de trabalho de Asgard: estantes (tomos e pergaminhos), baú, bancada de entalhe, cesto,
// braseiro, treliça de madeira, plantas, suporte de armas e pedra rúnica. Coordenadas = footprint (furniture/office.ts).
import { mix, ramp, shade, withAlpha } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, type BufFurniture } from '../core/sprite';
import { contact, foliage, frontFace, leafBlade, pick, rngOf, topFace, underRect } from '../furniture/kit';
import {
  COUROS, MAGIA, N, SEPIA, acende, chama, elmo, faisca, frasco, friso, frisoV, halo, pomo, rebite, runa, runinha, tomo, vela,
  type Luzes,
} from './trabalho-kit';

// ------------------------------------------------------------------ estantes

/** Cálice de ouro (o "troféu"). */
function calice(b: PixelBuf, x: number, y: number): void {
  const o = N.ouro;
  b.rect(x, y, 4, 2, o.base);
  b.hline(x, x + 3, y, o.lt);
  b.set(x, y, o.hi);
  b.set(x + 1, y + 2, o.dk);
  b.set(x + 2, y + 2, o.dk);
  b.vline(x + 1, y + 3, y + 3, o.base);
  b.hline(x, x + 3, y + 4, o.dk);
}

/** Pilha de pergaminhos enrolados vistos pela ponta (pirâmide de círculos). */
function pilhaRolos(b: PixelBuf, x: number, bottom: number, n: number, r: () => number): number {
  const p = N.pergaminho;
  const end = (cx: number, cy: number) => {
    b.stamp(['.a.', 'aca', '.a.'], cx, cy, { a: p.lt, c: p.dk });
    b.set(cx, cy + 1, p.base);
    if (r() < 0.3) b.set(cx + 1, cy + 2, '#a83a2c');
  };
  for (let i = 0; i < n; i++) end(x + i * 3, bottom - 2);
  for (let i = 0; i < n - 1; i++) end(x + 1 + i * 3, bottom - 4);
  if (n > 2) end(x + 3, bottom - 6);
  return n * 3;
}

/** Recheio de um vão de prateleira (de x0 a x1, apoiado em `bottom`, com `h` de altura útil). */
function prateleira(b: PixelBuf, x0: number, x1: number, bottom: number, h: number, r: () => number, luz: Luzes, seed: number): void {
  let x = x0;
  while (x < x1) {
    const k = r();
    if (k < 0.12 && x < x1 - 9) {
      x += pilhaRolos(b, x, bottom, 3, r) + 1;
    } else if (k < 0.2 && x < x1 - 4) {
      vela(b, x + 1, bottom - 4, luz, 4);
      x += 5;
    } else if (k < 0.27 && x < x1 - 5) {
      calice(b, x, bottom - 4);
      x += 6;
    } else if (k < 0.34 && x < x1 - 4) {
      frasco(b, x, bottom - 4, pick(r, ['#5ed2f2', '#8fd16a', '#d0574a', '#b07ae8']));
      if (x < x1 - 7) frasco(b, x + 3, bottom - 4, pick(r, ['#5ed2f2', '#8fd16a', '#e0b043']));
      x += 7;
    } else if (k < 0.4 && x < x1 - 7 && h >= 8) {
      elmo(b, x, bottom - 4);
      x += 8;
    } else if (k < 0.46 && x < x1 - 6) {
      // Pedra rúnica pequena, com a runa acesa.
      b.rect(x, bottom - 4, 4, 5, N.pedra.base);
      b.hline(x + 1, x + 2, bottom - 5, N.pedra.lt);
      b.vline(x, bottom - 4, bottom, N.pedra.lt);
      b.vline(x + 3, bottom - 4, bottom, N.pedra.dk);
      luz.push(() => runinha(b, x, bottom - 3, seed + x, MAGIA.lt));
      x += 6;
    } else {
      // Tomos de couro com alturas variadas (às vezes um deitado por cima).
      const n = 2 + Math.floor(r() * 4);
      for (let i = 0; i < n && x < x1; i++) {
        const bw = 1 + Math.floor(r() * 2);
        const bh = Math.min(h, 6 + Math.floor(r() * 4));
        tomo(b, x, bottom - bh + 1, bw, bh, pick(r, COUROS));
        x += bw;
      }
      if (r() < 0.3 && x < x1 - 5) {
        tomo(b, x, bottom - 1, 5, 2, pick(r, COUROS));
        tomo(b, x + 1, bottom - 3, 4, 2, pick(r, COUROS));
        x += 6;
      } else x += 1;
    }
  }
}

/** Estante larga (2x1) de carvalho entalhado: crista com cabeças de dragão, tomos, pergaminhos e relíquias. */
export function estante(seed: number): BufFurniture {
  const s = floorSheet(2, 1, 27);
  const b = s.buf;
  const w = N.carvalho;
  const r = rngOf(seed, 21);
  const luz: Luzes = [];
  // Crista: tábua arqueada sobre o topo, com as pontas em espiral (cabeças de dragão estilizadas).
  b.rect(3, -24, 26, 3, w.base);
  b.hline(5, 26, -25, w.lt);
  b.hline(3, 28, -24, w.lt);
  friso(b, 6, -23, 20, w, 1);
  for (const [x, dir] of [[0, 1], [31, -1]] as const) {
    b.rect(x - (dir < 0 ? 2 : 0), -25, 3, 3, w.base);
    b.set(x + dir, -26, w.lt);
    b.set(x + dir * 2, -26, w.base);
    b.set(x, -25, w.hi);
    b.set(x + dir, -24, N.ouro.lt);
  }
  pomo(b, 15, -27);
  topFace(b, 0, -21, 32, 3, w);
  // Corpo: laterais, fundo escuro e prateleiras.
  b.rect(0, -18, 32, 34, w.dk);
  b.rect(2, -17, 28, 31, shade(w.dd, -0.14));
  b.vline(0, -18, 15, w.lt);
  b.vline(1, -18, 15, w.base);
  b.vline(30, -18, 15, w.base);
  b.vline(31, -18, 15, w.dd);
  const shelves = [-8, 3, 15];
  for (const y of shelves) {
    b.hline(1, 30, y, w.lt);
    b.hline(1, 30, y + 1, w.dk);
  }
  b.hline(0, 31, 15, w.dd);
  shelves.forEach((shelf, i) => prateleira(b, 3, 29, shelf - 1, i === 2 ? 9 : 8, r, luz, seed + i * 5));
  // Cantoneiras de ferro.
  for (const [x, y] of [[0, -18], [29, -18], [0, 12], [29, 12]] as const) {
    b.rect(x, y, 3, 3, N.ferro.base);
    b.set(x + (x ? 2 : 0), y + (y < 0 ? 0 : 2), N.ferro.lt);
    rebite(b, x + 1, y + 1);
  }
  b.outline();
  acende(luz);
  contact(b, -1, 13, 34, 4, 0.26);
  return { base: s };
}

/** Estante estreita de pergaminhos: estojos de couro em pé, pirâmide de rolos e um baú pequeno embaixo. */
export function estantePergaminhos(seed: number): BufFurniture {
  const s = floorSheet(1, 1, 24);
  const b = s.buf;
  const w = N.carvalho;
  const r = rngOf(seed, 23);
  const luz: Luzes = [];
  topFace(b, 0, -21, 16, 3, w);
  pomo(b, 1, -23);
  pomo(b, 13, -23);
  b.rect(0, -18, 16, 34, w.dk);
  b.rect(1, -17, 14, 31, shade(w.dd, -0.14));
  b.vline(0, -18, 15, w.lt);
  b.vline(15, -18, 15, w.dd);
  const shelves = [-8, 3, 15];
  for (const y of shelves) {
    b.hline(1, 14, y, w.lt);
    b.hline(1, 14, y + 1, w.dk);
  }
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  shelves.forEach((shelf, i) => {
    const bottom = shelf - 1;
    const what = i === 2 && seed % 2 === 0 ? 3 : order[i];
    if (what === 0) {
      // Estojos de couro em pé, com tampas de ouro.
      let x = 2;
      while (x < 13) {
        const c = pick(r, ['#6a4a30', '#7a2e2a', '#3e5a34', '#2f405e']);
        const hh = 5 + Math.floor(r() * 3);
        b.rect(x, bottom - hh + 1, 2, hh, c);
        b.vline(x, bottom - hh + 1, bottom, shade(c, 0.12));
        b.hline(x, x + 1, bottom - hh + 1, N.ouro.lt);
        b.hline(x, x + 1, bottom - 1, N.ouro.dk);
        x += 3;
      }
    } else if (what === 1) {
      pilhaRolos(b, 2, bottom, 4, r);
    } else if (what === 2) {
      // Tomos deitados e um frasco.
      for (let k = 0; k < 3; k++) tomo(b, 2 + (k % 2), bottom - 1 - k * 2, 7, 2, pick(r, COUROS));
      frasco(b, 11, bottom - 4, pick(r, ['#5ed2f2', '#8fd16a', '#d0574a']));
    } else {
      // Baú pequeno de ferro.
      b.rect(2, bottom - 5, 11, 6, N.couro.dk);
      b.hline(2, 12, bottom - 5, N.couro.base);
      b.hline(2, 12, bottom - 3, N.ferro.base);
      b.set(7, bottom - 2, N.ouro.lt);
      b.set(7, bottom - 1, N.ouro.dk);
      vela(b, 12, bottom - 10, luz, 3);
    }
  });
  b.outline();
  acende(luz);
  contact(b, 0, 13, 16, 4, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ baú

/** Baú de carvalho com tampa abaulada, cintas de ferro e fechadura de ouro (no lugar do arquivo). */
export function bau(): BufFurniture {
  const s = floorSheet(1, 1, 8);
  const b = s.buf;
  const w = N.carvalho;
  const f = N.ferro;
  // Corpo: tábuas verticais.
  frontFace(b, 1, 4, 14, 12, w);
  for (const x of [5, 10]) b.vline(x, 5, 14, w.dk);
  b.hline(1, 14, 4, w.dd);
  // Tampa abaulada: do fundo (escuro) à crista (brilho) e de volta à aba.
  const rows = [w.base, w.lt, w.hi, w.lt, w.base, w.dk, w.dd];
  rows.forEach((c, i) => b.hline(1, 14, -3 + i, c));
  b.set(1, -3, w.dk);
  b.set(14, -3, w.dk);
  // Cintas de ferro que passam pela tampa e descem pela frente.
  for (const x of [2, 12]) {
    rows.forEach((_, i) => b.hline(x, x + 1, -3 + i, i === 2 ? f.hi : i < 2 ? f.lt : i < 5 ? f.base : f.dk));
    b.rect(x, 4, 2, 12, f.base);
    b.vline(x, 4, 15, f.lt);
    rebite(b, x, 7);
    rebite(b, x, 12);
  }
  b.hline(1, 14, 15, w.dd);
  // Fechadura.
  b.rect(7, 2, 2, 5, N.ouro.base);
  b.set(7, 2, N.ouro.hi);
  b.set(8, 6, N.ouro.dk);
  b.set(7, 5, '#2a1e18');
  b.outline();
  contact(b, 0, 13, 16, 4, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ bancada de entalhe

/** Bancada de entalhe (no lugar da impressora): pedra rúnica presa no tampo, marreta, cinzel e lascas. */
export function bancadaEntalhe(): BufFurniture {
  const s = floorSheet(1, 1, 17);
  const b = s.buf;
  const w = N.carvalho;
  const p = N.pedra;
  const luz: Luzes = [];
  // Pernas, prateleira baixa com blocos de pedra e tampo grosso.
  for (const x of [0, 13]) {
    b.rect(x, 3, 3, 13, w.base);
    b.vline(x, 3, 15, w.lt);
    b.vline(x + 2, 3, 15, w.dk);
  }
  b.rect(3, 11, 10, 2, w.dk);
  b.hline(3, 12, 11, w.base);
  b.rect(4, 8, 4, 3, p.base);
  b.hline(4, 7, 8, p.lt);
  b.rect(8, 9, 3, 2, p.dk);
  b.hline(8, 10, 9, p.base);
  topFace(b, 0, -3, 16, 5, w);
  b.rect(0, 2, 16, 3, w.base);
  b.hline(0, 15, 2, w.lt);
  b.hline(0, 15, 4, w.dk);
  b.set(0, 3, w.dd);
  b.set(15, 3, w.dd);
  // Pedra rúnica em pé (topo arredondado), com a faixa da serpente pintada e runas entalhadas.
  const sx = 2;
  const top = -16;
  for (let y = top; y <= -1; y++) {
    const inset = y === top ? 2 : y === top + 1 ? 1 : 0;
    b.hline(sx + inset, sx + 8 - inset, y, p.base);
    b.set(sx + inset, y, p.lt);
    b.set(sx + 8 - inset, y, p.dk);
  }
  b.hline(sx + 2, sx + 6, top, p.hi);
  const ocre = '#b4452f';
  b.vline(sx + 1, top + 3, -3, ocre);
  b.vline(sx + 7, top + 3, -3, ocre);
  b.hline(sx + 2, sx + 6, top + 2, ocre);
  b.hline(sx + 2, sx + 6, -2, ocre);
  b.set(sx + 7, top + 2, shade(ocre, 0.15));
  runa(b, sx + 3, top + 4, 1, p.dd);
  b.set(sx + 4, -5, p.dd);
  luz.push(() => {
    runa(b, sx + 3, -8, 3, MAGIA.lt);
    b.set(sx + 4, -9, withAlpha(MAGIA.hi, 0.7));
  });
  // Marreta e cinzel no tampo; lascas no tampo e no chão.
  b.rect(11, -3, 3, 2, w.lt);
  b.set(11, -3, w.hi);
  b.line(13, -1, 15, 1, w.dk);
  b.hline(10, 13, 1, N.ferro.lt);
  b.set(14, 1, w.base);
  for (const [x, y] of [[9, 0], [12, -1], [1, 1], [4, 15], [11, 15], [7, 14]] as const) b.set(x, y, p.hi);
  b.outline();
  acende(luz);
  contact(b, -1, 13, 18, 4, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ cesto

/** Cesto de vime trançado com pergaminhos amassados (no lugar da lixeira). */
export function cesto(): BufFurniture {
  const s = floorSheet(1, 1, 3);
  const b = s.buf;
  const v = N.vime;
  for (let y = 7; y <= 15; y++) {
    const inset = y > 13 ? 1 : 0;
    for (let x = 4 + inset; x <= 11 - inset; x++) {
      const over = (((x + (y % 2) * 2) >> 1) & 1) === 0;
      b.set(x, y, over ? v.lt : v.base);
    }
    b.set(4 + inset, y, v.lt);
    b.set(11 - inset, y, v.dk);
    if (y % 2 === 0) b.set(10 - inset, y, v.dk);
  }
  b.hline(5, 10, 15, v.dk);
  b.ellipse(8, 6.5, 4.6, 2, v.base);
  for (let x = 4; x <= 12; x++) b.set(x, 5 + (x % 2), x % 2 ? v.hi : v.lt);
  b.ellipse(8, 6.6, 3.4, 1.2, v.dd);
  // Pergaminho amassado e uma pena quebrada.
  b.rect(6, 5, 3, 2, N.pergaminho.lt);
  b.set(7, 5, N.pergaminho.dk);
  b.set(8, 6, SEPIA);
  b.line(9, 6, 11, 3, '#efeadf');
  b.outline();
  contact(b, 3, 14, 10, 2, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ braseiro

/** Braseiro de ferro num tripé alto (no lugar da luminária). rects.glow = o fogo. */
export function braseiro(): BufFurniture {
  const s = floorSheet(1, 1, 30);
  const b = s.buf;
  const f = N.ferro;
  const luz: Luzes = [];
  // Tripé: dois pés da frente abertos e o de trás no meio.
  b.line(7, 7, 3, 15, f.base, 1);
  b.line(8, 7, 12, 15, f.dk, 1);
  b.line(7, 8, 4, 15, f.lt, 1);
  b.vline(8, 9, 14, f.dd);
  for (const x of [2, 12]) b.hline(x, x + 1, 15, f.dk);
  // Fuste com anéis de ouro.
  b.rect(7, -9, 2, 17, f.base);
  b.vline(7, -9, 7, f.lt);
  for (const y of [-3, 4]) {
    b.hline(6, 9, y, N.ouro.base);
    b.set(6, y, N.ouro.hi);
  }
  // Bacia: aro largo e bojo afunilado, com brasas aparecendo no aro.
  b.rect(2, -14, 12, 2, f.lt);
  b.hline(2, 13, -14, f.hi);
  for (let i = 0; i < 4; i++) b.hline(3 + i, 12 - i, -12 + i, i < 2 ? f.base : f.dk);
  b.hline(3, 12, -12, f.dk);
  for (const x of [3, 6, 9, 12]) b.set(x, -12, N.ouro.dk);
  b.hline(4, 11, -15, '#5a2a1a');
  luz.push(() => {
    for (let x = 4; x <= 11; x++) b.set(x, -15, x % 3 === 0 ? '#ff8a3a' : x % 3 === 1 ? '#c2412a' : '#ffb347');
    chama(b, 6, -16, 7, 4);
    chama(b, 10, -16, 6, 4);
    chama(b, 8, -16, 10, 5);
    halo(b, 8, -19, 7, 6, '#ffb347', 0.22);
  });
  b.outline();
  acende(luz);
  contact(b, 2, 13, 12, 3, 0.26);
  s.rects = { glow: rectAt(s, 3, -25, 10, 9) };
  return { base: s };
}

// ------------------------------------------------------------------ treliça de madeira

/** Treliça de madeira sobre mureta de pedra: 'h' corre leste-oeste, 'v' norte-sul e 'end' é o poste da ponta. */
export function trelica(variant: string | undefined): BufFurniture {
  const v = variant ?? 'h';
  const s = floorSheet(1, 1, 22, 2);
  const b = s.buf;
  const w = N.carvalho;
  const p = N.pedra;
  if (v === 'v') {
    // Vista de cima: o topo do travessão de madeira e a crista da mureta; sem contorno para emendar.
    const cols = [w.dd, w.hi, w.lt, w.lt, w.base, w.dk, p.dk, shade(p.dd, -0.1)];
    cols.forEach((c, i) => b.vline(4 + i, -16, 15, c));
    for (let y = -16; y < 16; y += 8) {
      b.set(6, y, w.base);
      b.set(7, y, w.base);
      b.set(7, y + 1, N.ferro.lt);
    }
    underRect(b, 12, -16, 2, 32, 'rgba(24,14,10,0.16)');
    return { base: s };
  }
  if (v === 'end') {
    // Poste entalhado com pomo de ouro sobre um bloco de pedra.
    topFace(b, 4, 3, 8, 4, p);
    frontFace(b, 4, 7, 8, 9, p);
    b.hline(4, 11, 11, p.dk);
    b.vline(8, 7, 10, p.dk);
    b.rect(5, -18, 6, 21, w.base);
    b.vline(5, -18, 2, w.lt);
    b.vline(10, -18, 2, w.dk);
    frisoV(b, 6, -15, 16, w);
    b.rect(4, -20, 8, 2, w.lt);
    b.hline(4, 11, -20, w.hi);
    b.hline(4, 11, -19, w.base);
    pomo(b, 7, -22);
    b.outline();
    contact(b, 3, 13, 10, 4, 0.22);
    return { base: s };
  }
  // 'h': mureta de pedra + travessão e treliça em losangos (vazada).
  topFace(b, 0, 6, 16, 3, p);
  frontFace(b, 0, 9, 16, 7, p);
  b.hline(0, 15, 12, p.dk);
  for (const [x, y0] of [[4, 9], [12, 9], [0, 13], [8, 13]] as const) b.vline(x, y0, y0 + 2, p.dk);
  b.rect(0, -17, 16, 3, w.lt);
  b.hline(0, 15, -17, w.hi);
  b.hline(0, 15, -15, w.dk);
  // Montante na emenda (vira a coluna da treliça contínua) e a máscara da treliça para o contorno.
  b.rect(0, -14, 16, 20, '#000000');
  b.outline();
  b.clearRect(0, -14, 16, 20);
  for (let y = -14; y < 6; y++) {
    for (let x = 0; x < 16; x++) {
      const d1 = (((x + y) % 8) + 8) % 8 === 0;
      const d2 = (((x - y) % 8) + 8) % 8 === 0;
      if (d1 && d2) b.set(x, y, w.hi);
      else if (d1) b.set(x, y, w.lt);
      else if (d2) b.set(x, y, w.base);
      else if ((((x + y + 1) % 8) + 8) % 8 === 0 || (((x - y - 1) % 8) + 8) % 8 === 0) b.set(x, y, 'rgba(30,18,12,0.35)');
    }
  }
  b.rect(0, -14, 2, 20, w.base);
  b.vline(0, -14, 5, w.lt);
  b.hline(0, 15, 5, w.dk);
  // Sem contorno nas laterais: segmentos vizinhos emendam.
  for (let y = 0; y < b.h; y++) {
    b.clear(-1, y - b.oy);
    b.clear(16, y - b.oy);
  }
  contact(b, 0, 14, 16, 3, 0.18);
  return { base: s };
}

// ------------------------------------------------------------------ plantas

/** Balde de madeira com aros de ferro (vaso). */
function balde(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  const m = N.pinho;
  for (let i = 0; i < h; i++) {
    const inset = i >= h - 2 ? 1 : 0;
    for (let xx = x + inset; xx <= x + w - 1 - inset; xx++) b.set(xx, y + i, (xx - x) % 3 === 0 ? m.dk : m.base);
    b.set(x + inset, y + i, m.lt);
    b.set(x + w - 1 - inset, y + i, m.dk);
  }
  b.hline(x, x + w - 1, y, m.lt);
  b.hline(x + 1, x + w - 2, y + 1, '#3a2a20');
  b.hline(x, x + w - 1, y + 2, N.ferro.lt);
  b.hline(x + 1, x + w - 2, y + h - 2, N.ferro.base);
}

/** Tigela de pedra baixa com uma runa entalhada. */
function tigelaPedra(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  const p = N.pedra;
  for (let i = 0; i < h; i++) {
    const inset = i === h - 1 ? 2 : i === h - 2 ? 1 : 0;
    b.hline(x + inset, x + w - 1 - inset, y + i, i === 0 ? p.lt : p.base);
    b.set(x + inset, y + i, p.lt);
    b.set(x + w - 1 - inset, y + i, p.dk);
  }
  b.hline(x + 1, x + w - 2, y, '#3a2a20');
  runinha(b, x + Math.floor(w / 2) - 1, y + 1, 3, p.dd);
}

/** Vaso de barro com faixa de runas pintadas. */
function vasoBarro(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  const m = ramp('#9c5a3a', 0.07);
  b.rect(x, y, w, 2, m.lt);
  b.hline(x, x + w - 1, y, m.hi);
  b.hline(x + 1, x + w - 2, y + 1, '#3a2a20');
  for (let i = 2; i < h; i++) {
    const inset = i >= h - 2 ? 1 : 0;
    b.hline(x + inset, x + w - 1 - inset, y + i, m.base);
    b.set(x + inset, y + i, m.lt);
    b.set(x + w - 1 - inset, y + i, m.dk);
  }
  for (let xx = x + 1; xx < x + w - 1; xx += 2) b.set(xx, y + 3, N.ouro.base);
  b.hline(x + 1, x + w - 2, y + h - 1, m.dk);
}

const VERDE = ramp('#3f7a45', 0.08);
const VERDE_ESC = ramp('#2c5a3a', 0.07);

export function plantaPequena(variant: string | undefined, seed: number): BufFurniture {
  const s = floorSheet(1, 1, 10);
  const b = s.buf;
  const v = variant ?? 'fern';
  const r = rngOf(seed, 5);
  if (v === 'succulent') {
    // Semprevivas ("barba-de-Thor", que protegiam os telhados do raio) numa tigela de pedra.
    tigelaPedra(b, 2, 10, 12, 6);
    const g = ramp('#6f9f6a', 0.08);
    const rosa = (cx: number, cy: number, big: boolean) => {
      if (big) {
        b.stamp(['..a..', '.aba.', 'abcba', '.aba.', '..a..'], cx - 2, cy - 2, { a: g.base, b: g.lt, c: g.hi });
        for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0]] as const) b.set(cx + dx, cy + dy, '#b0566a');
        b.set(cx, cy + 2, g.dk);
      } else {
        b.stamp(['.a.', 'aca', '.a.'], cx - 1, cy - 1, { a: g.base, c: g.lt });
      }
    };
    rosa(5, 8, true);
    rosa(11, 8, true);
    rosa(8, 6, seed % 2 === 0);
    rosa(13, 10, false);
    rosa(3, 10, false);
  } else if (v === 'flower') {
    // Urze florida num vaso de barro com runas.
    vasoBarro(b, 4, 9, 8, 7);
    const g = VERDE_ESC;
    for (const [x1, y1] of [[2, 4], [14, 4], [5, 1], [11, 1], [8, 0], [3, 7], [13, 7]] as const) b.line(8, 9, x1, y1, g.base);
    foliage(b, 8, 4.5, 5.5, 3.6, g, seed + 11);
    const cor = pick(r, ['#a465c0', '#d77fa8', '#efe2f2']);
    for (let i = 0; i < 16; i++) {
      const x = 3 + Math.floor(r() * 11);
      const y = 1 + Math.floor(r() * 7);
      if (!b.alpha(x, y)) continue;
      b.set(x, y, i % 3 ? cor : shade(cor, 0.14));
    }
  } else {
    // Samambaia num balde de madeira.
    balde(b, 4, 9, 8, 7);
    const g = VERDE;
    const fr: [number, number, number][] = [[0, 7, 0], [16, 7, 0], [2, 1, 1], [14, 1, 0], [5, -3, 1], [11, -3, 1], [8, -5, 1], [-1, 11, 0], [17, 11, 0]];
    fr.forEach(([x1, y1, light]) => leafBlade(b, 8, 9, x1, y1, 2.6, light ? g : ramp(g.dk, 0.07), x1 < 8));
    b.set(8, -5, g.hi);
  }
  b.outline();
  contact(b, 3, 14, 10, 2, 0.26);
  return { base: s };
}

/** Barril-floreira de carvalho com aros de ferro. */
function barrilVaso(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  const m = N.carvalho;
  for (let i = 0; i < h; i++) {
    const bulge = i > 1 && i < h - 2 ? 0 : 1;
    for (let xx = x + bulge; xx <= x + w - 1 - bulge; xx++) b.set(xx, y + i, (xx - x) % 3 === 1 ? m.dk : m.base);
    b.set(x + bulge, y + i, m.lt);
    b.set(x + w - 1 - bulge, y + i, m.dd);
  }
  b.hline(x + 1, x + w - 2, y, m.lt);
  b.hline(x + 2, x + w - 3, y + 1, '#3a2a20');
  for (const yy of [y + 2, y + h - 3]) {
    b.hline(x, x + w - 1, yy, N.ferro.base);
    b.set(x, yy, N.ferro.lt);
  }
}

export function plantaAlta(variant: string | undefined, seed: number): BufFurniture {
  const s = floorSheet(1, 1, 26, 6);
  const b = s.buf;
  const v = variant ?? 'ficus';
  const luz: Luzes = [];
  if (v === 'bonsai') {
    // Yggdrasil em miniatura: tronco retorcido sobre uma rocha musgosa, raízes abraçando a pedra, copa em nuvens.
    const p = N.pedra;
    b.ellipse(8, 11.5, 7, 4, p.dk);
    b.ellipse(7.5, 10.8, 6.4, 3.4, p.base);
    b.ellipse(6.5, 9.8, 4, 2, p.lt);
    b.set(5, 9, p.hi);
    for (const [x, y] of [[3, 13], [4, 14], [11, 14], [12, 13], [13, 12], [2, 12]] as const) b.set(x, y, '#5f8a3a');
    const tr = ramp('#6e4e36', 0.08);
    b.line(4, 12, 7, 8, tr.dk, 1);
    b.line(12, 12, 9, 8, tr.dk, 1);
    b.line(2, 10, 6, 8, tr.base, 1);
    b.line(14, 10, 10, 8, tr.base, 1);
    b.line(8, 8, 7, 1, tr.base, 2);
    b.line(7, 1, 9, -4, tr.base, 2);
    b.line(9, -4, 8, -9, tr.base, 1);
    b.line(8, -2, 4, -5, tr.base, 1);
    b.line(9, -4, 12, -7, tr.base, 1);
    b.set(7, 3, tr.lt);
    b.set(8, -1, tr.lt);
    foliage(b, 4, -7.5, 3.6, 2.2, VERDE_ESC, seed + 3);
    foliage(b, 12.5, -8.5, 3.2, 2, VERDE_ESC, seed + 4);
    foliage(b, 8.5, -11.5, 4.4, 2.6, VERDE, seed + 5);
    luz.push(() => {
      faisca(b, 2, -12);
      b.set(14, -13, withAlpha(MAGIA.lt, 0.8));
      b.set(8, 9, MAGIA.base);
      b.set(5, 11, withAlpha(MAGIA.lt, 0.7));
    });
  } else if (v === 'palm') {
    // Abeto jovem num barril.
    barrilVaso(b, 3, 6, 10, 10);
    const g = ramp('#2f6a4a', 0.07);
    b.vline(8, -2, 6, '#5a3d2a');
    const tiers: [number, number, number][] = [[-20, 2, 3], [-15, 4, 4], [-10, 5, 5], [-4, 7, 5]];
    for (const [ty, half, hgt] of tiers) {
      for (let i = 0; i < hgt; i++) {
        const hw = Math.round(half * ((i + 1) / hgt));
        b.hline(8 - hw, 8 + hw, ty + i, i === hgt - 1 ? g.dk : g.base);
        b.set(8 - hw, ty + i, g.lt);
        if (i === hgt - 1) for (let x = 8 - hw; x <= 8 + hw; x += 2) b.set(x, ty + i + 1, g.dd);
      }
    }
    b.set(8, -21, g.hi);
    b.set(7, -14, g.hi);
    b.set(6, -9, g.lt);
    b.set(5, -3, g.lt);
  } else if (v === 'monstera') {
    // Macieira de Idun (as maçãs douradas que mantêm os deuses jovens), num barril.
    barrilVaso(b, 3, 6, 10, 10);
    const tr = '#6a4a33';
    b.line(8, 6, 8, -4, tr, 2);
    b.line(8, -1, 4, -5, tr, 1);
    b.line(9, -3, 12, -7, tr, 1);
    foliage(b, 8, -11, 7.2, 5.6, VERDE_ESC, seed + 7);
    foliage(b, 6, -13.5, 4.6, 3.6, VERDE, seed + 8);
    foliage(b, 11.5, -9.5, 3.8, 3.2, VERDE, seed + 9);
    const r = rngOf(seed, 13);
    for (let i = 0; i < 6; i++) {
      const x = 3 + Math.floor(r() * 10);
      const y = -16 + Math.floor(r() * 10);
      if (!b.alpha(x, y) || !b.alpha(x + 1, y + 1)) continue;
      b.set(x, y, N.ouro.hi);
      b.set(x + 1, y, N.ouro.lt);
      b.set(x, y + 1, N.ouro.base);
      b.set(x + 1, y + 1, N.ouro.dk);
    }
  } else {
    // Bétula: tronco branco com marcas escuras e copa clara, num vaso de pedra.
    const p = N.pedra;
    for (let i = 0; i < 9; i++) {
      const inset = i >= 7 ? 1 : 0;
      b.hline(3 + inset, 12 - inset, 7 + i, i === 0 ? p.lt : p.base);
      b.set(3 + inset, 7 + i, p.lt);
      b.set(12 - inset, 7 + i, p.dk);
    }
    b.hline(4, 11, 7, '#3a2a20');
    b.hline(3, 12, 9, p.dk);
    for (let y = -6; y <= 7; y++) {
      b.set(7, y, '#ece6da');
      b.set(8, y, '#cfc7b8');
      if ((y * 7 + seed) % 4 === 0) b.set(7 + (y % 2 ? 1 : 0), y, '#3a3434');
    }
    b.line(8, -3, 11, -7, '#e2dbcd');
    b.line(7, -1, 4, -5, '#e2dbcd');
    const g = ramp('#6f9f4a', 0.08);
    foliage(b, 8, -11, 7, 5.2, ramp('#4f8a3e', 0.08), seed + 7);
    foliage(b, 6, -13.5, 4.4, 3.4, g, seed + 8);
    foliage(b, 11.5, -9, 3.6, 3, g, seed + 9);
    foliage(b, 4, -7.5, 3, 2.4, g, seed + 10);
  }
  b.outline();
  acende(luz);
  contact(b, 2, 14, 12, 3, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ suporte de armas

/** Machado barbado: cabo de (x0, y0) até a ponta (x1, y1) e a lâmina na ponta, virada para `dir`. */
function machado(b: PixelBuf, x0: number, y0: number, x1: number, y1: number, dir: 1 | -1): void {
  const w = N.pinho;
  const f = N.ferro;
  b.line(x0, y0, x1, y1, w.base, 1);
  b.line(x0 + 1, y0, x1 + 1, y1, w.dk, 1);
  b.set(x0, y0, w.dd);
  const head = ['hh...', 'bbbh.', 'bbbbb', '.bbbd', '..bd.', '...d.'];
  b.stamp(head, dir > 0 ? x1 + 1 : x1 - 4, y1 - 1, { h: f.hi, b: f.lt, d: f.dk }, dir < 0);
  b.set(x1, y1, f.dk);
  b.set(x1 + (dir > 0 ? 1 : 0), y1 + 1, f.dk);
}

/** Lança: haste longa e ponta em folha com anel de ouro. */
function lanca(b: PixelBuf, x: number, top: number, bottom: number): void {
  const f = N.ferro;
  b.vline(x, top + 5, bottom, N.pinho.base);
  b.set(x, bottom, N.pinho.dk);
  b.stamp(['.h.', 'hb.', 'hbd', 'hbd', '.b.', '.g.'], x - 1, top, { h: f.hi, b: f.lt, d: f.dk, g: N.ouro.base });
}

/** Escudo redondo pintado em quartos, com aro de ferro e bossa central. */
function escudoRedondo(b: PixelBuf, cx: number, cy: number, rad: number, c1: string, c2: string): void {
  const f = N.ferro;
  b.ellipse(cx, cy, rad, rad, f.base);
  b.ellipse(cx, cy, rad - 1, rad - 1, c1);
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) {
    for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > (rad - 1) * (rad - 1)) continue;
      if ((dx < 0) !== (dy < 0)) b.set(x, y, c2);
    }
  }
  b.ellipse(cx, cy, 1.6, 1.6, f.lt);
  b.set(Math.floor(cx - 1), Math.floor(cy - 1), f.hi);
  b.set(Math.floor(cx - rad + 1.5), Math.floor(cy - 1), f.hi);
}

/** Suporte de armas (2x1): cavalete de carvalho com duas lanças, dois machados cruzados e o escudo à frente. */
export function suporteArmas(): BufFurniture {
  const s = floorSheet(2, 1, 30);
  const b = s.buf;
  const w = N.carvalho;
  // Postes com pomos e a travessa onde as armas se apoiam.
  for (const x of [1, 28]) {
    b.rect(x, -12, 3, 27, w.base);
    b.vline(x, -12, 14, w.lt);
    b.vline(x + 2, -12, 14, w.dk);
    pomo(b, x, -14);
  }
  b.rect(1, -10, 30, 3, w.base);
  b.hline(1, 30, -10, w.lt);
  b.hline(1, 30, -8, w.dk);
  friso(b, 5, -10, 22, w, 2);
  // Lanças encostadas nos postes e machados cruzados.
  lanca(b, 6, -27, 12);
  lanca(b, 25, -26, 12);
  machado(b, 9, 10, 19, -16, 1);
  machado(b, 23, 10, 13, -16, -1);
  // Escudo redondo encostado na frente e a base (caixa baixa) segurando os cabos.
  escudoRedondo(b, 16, 3, 7.5, '#9a2f2a', '#e8dcc0');
  b.rect(0, 11, 32, 5, w.base);
  b.hline(0, 31, 11, w.lt);
  b.hline(0, 31, 15, w.dd);
  friso(b, 1, 12, 30, w);
  for (const x of [0, 30]) {
    b.rect(x, 11, 2, 5, N.ferro.base);
    b.set(x, 11, N.ferro.lt);
  }
  b.outline();
  contact(b, -1, 13, 34, 4, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ pedra rúnica

/** Pedra rúnica em pé, cinza-azulada, com runas entalhadas que brilham de leve e musgo na base. */
export function pedraRunica(): BufFurniture {
  const s = floorSheet(1, 1, 22);
  const b = s.buf;
  const p = N.pedra;
  const luz: Luzes = [];
  // Silhueta: laje alta de topo arredondado e um pouco inclinada, com a lateral direita à sombra.
  const top = -18;
  for (let y = top; y <= 14; y++) {
    const k = y - top;
    const l = 3 + (k === 0 ? 3 : k === 1 ? 1 : k === 2 ? 0 : 0) + (y > 10 ? -1 : 0);
    const rgt = 12 - (k === 0 ? 2 : k === 1 ? 1 : 0) + (y > 11 ? 1 : 0);
    b.hline(l, rgt, y, p.base);
    b.set(l, y, p.lt);
    b.set(rgt, y, p.dd);
    b.set(rgt - 1, y, p.dk);
  }
  b.hline(6, 9, top, p.hi);
  b.hline(5, 10, top + 1, p.lt);
  // Textura: lascas e veios.
  const r = rngOf(7, 3);
  for (let i = 0; i < 14; i++) b.set(5 + Math.floor(r() * 6), top + 2 + Math.floor(r() * 28), r() < 0.5 ? p.lt : p.dk);
  // Faixa da serpente (tinta desbotada) e as runas em coluna.
  const ocre = mix('#b4452f', p.base, 0.35);
  b.vline(4, top + 4, 11, ocre);
  b.vline(10, top + 4, 11, ocre);
  b.line(4, top + 4, 7, top + 2, ocre);
  b.line(10, top + 4, 8, top + 2, ocre);
  b.set(9, 12, ocre);
  b.set(5, 12, ocre);
  for (let i = 0; i < 4; i++) runa(b, 6, top + 5 + i * 6, i * 3 + 1, p.dd);
  // Musgo na base.
  for (const [x, y] of [[3, 13], [4, 14], [5, 14], [11, 13], [12, 14], [10, 14]] as const) b.set(x, y, '#5f8a3a');
  b.set(4, 13, '#7aa04a');
  b.outline();
  luz.push(() => {
    for (let i = 0; i < 4; i++) {
      const y = top + 5 + i * 6;
      runa(b, 6, y, i * 3 + 1, i === 1 ? MAGIA.hi : MAGIA.lt);
      for (let k = 0; k < 5; k++) {
        b.set(5, y + k, withAlpha(MAGIA.base, 0.18));
        b.set(9, y + k, withAlpha(MAGIA.base, 0.18));
      }
    }
    halo(b, 7.5, -4, 8, 13, MAGIA.base, 0.12);
  });
  acende(luz);
  contact(b, 1, 13, 14, 4, 0.28);
  return { base: s };
}
