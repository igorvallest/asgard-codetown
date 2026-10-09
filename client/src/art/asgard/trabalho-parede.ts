// Itens de parede das salas de trabalho de Asgard: quadro de runas, janela em arco, disco de sol e lua, escudos,
// tapeçaria, placa entalhada, tocha (o interruptor), arco entalhado da porta, chifres de beber e estandartes.
// Coordenadas como em furniture/wall.ts: x = 0 na borda esquerda do trecho, y = 0 no rodapé; a face vai de -32 a 0.
import { mix, ramp, shade, type Ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { rectAt, wallSheet, type BufFurniture } from '../core/sprite';
import { rngOf } from '../furniture/kit';
import { N, SEPIA, caneca, chamaTocha, chifre, friso, frisoV, pomo, rebite, runinha, sombraParede } from './trabalho-kit';

// ------------------------------------------------------------------ quadro de runas

/** Couro esticado numa moldura entalhada, preso por tiras; a área do couro é onde o mundo desenha as tarefas. */
export function quadroRunas(): BufFurniture {
  const s = wallSheet(3);
  const b = s.buf;
  const w = N.carvalho;
  const x = 2;
  const y = -27;
  const W = 44;
  const H = 19;
  // Moldura com a travessa de cima mais grossa e as pontas em espiral.
  b.rect(x, y, W, H, w.base);
  b.hline(x, x + W - 1, y + H - 1, w.dk);
  b.vline(x, y, y + H - 1, w.lt);
  b.vline(x + W - 1, y, y + H - 1, w.dk);
  b.rect(x - 2, y - 2, W + 4, 3, w.base);
  b.hline(x - 2, x + W + 1, y - 2, w.hi);
  friso(b, x + 4, y - 1, W - 8, w);
  for (const ex of [x - 2, x + W]) {
    b.rect(ex, y - 2, 2, 3, w.lt);
    b.set(ex + (ex < x ? 0 : 1), y + 1, w.base);
  }
  pomo(b, x + W / 2 - 1, y - 4);
  // Couro claro, com manchas e a borda escurecida pela tensão.
  const hide = ramp('#d8c199', 0.05);
  const r = rngOf(17, 2);
  b.rect(x + 2, y + 2, W - 4, H - 4, hide.base);
  for (let i = 0; i < 60; i++) b.set(x + 2 + Math.floor(r() * (W - 4)), y + 2 + Math.floor(r() * (H - 4)), r() < 0.5 ? hide.lt : hide.dk);
  b.hline(x + 2, x + W - 3, y + 2, hide.dk);
  b.vline(x + 2, y + 2, y + H - 3, hide.dk);
  // Tiras de couro amarrando a pele à moldura.
  for (let xx = x + 4; xx < x + W - 3; xx += 5) {
    b.set(xx, y + 1, '#c9a46a');
    b.set(xx, y + H - 2, '#c9a46a');
  }
  for (let yy = y + 4; yy < y + H - 3; yy += 5) {
    b.set(x + 1, yy, '#c9a46a');
    b.set(x + W - 2, yy, '#c9a46a');
  }
  // Cantoneiras de ferro.
  for (const [cx, cy] of [[x, y], [x + W - 2, y], [x, y + H - 2], [x + W - 2, y + H - 2]] as const) {
    b.rect(cx, cy, 2, 2, N.ferro.base);
    b.set(cx, cy, N.ferro.lt);
  }
  // Repisa com bastões de giz e carvão e um saquinho de runas.
  b.rect(x + 3, y + H, W - 6, 2, w.base);
  b.hline(x + 3, x + W - 4, y + H, w.lt);
  for (const [i, c] of [[0, '#efe9dc'], [3, '#2b2522'], [6, '#c8553a'], [9, '#efe9dc']] as const) b.rect(x + 8 + i, y + H - 1, 2, 1, c);
  b.rect(x + W - 13, y + H - 3, 4, 3, N.couro.base);
  b.set(x + W - 13, y + H - 3, N.couro.lt);
  b.set(x + W - 12, y + H - 4, '#c9a46a');
  b.outline();
  sombraParede(b, x - 3, y - 3, W + 6, H + 5);
  s.rects = { board: rectAt(s, x + 2, y + 2, W - 4, H - 4) };
  return { base: s };
}

// ------------------------------------------------------------------ janela em arco

/** Janela em arco de pedra com aduelas, fecho, montante e travessa de ferro. O vidro (o céu) fica vazado. */
export function janelaArco(): BufFurniture {
  const s = wallSheet(2);
  const b = s.buf;
  const p = N.pedra;
  const x = 2;
  const y = -27;
  const w = 28;
  const h = 19;
  const gx = x + 2;
  const gy = y + 2;
  const gw = w - 4;
  const gh = h - 4;
  const cx = gx + gw / 2;
  const ys = gy + 9;
  // Vão: retângulo embaixo da linha de nascença e meia-elipse em cima.
  const vao = (px: number, py: number, grow: number): boolean => {
    if (py >= ys) return px >= gx - grow && px < gx + gw + grow && py < gy + gh + grow;
    const ry = ys - gy + grow + 0.5;
    const dy = (ys - (py + 0.5)) / ry;
    if (dy > 1) return false;
    const half = (gw / 2 + grow) * Math.sqrt(1 - dy * dy);
    return px + 0.5 >= cx - half && px + 0.5 <= cx + half;
  };
  // Pedra do arco (aduelas alternadas) e das ombreiras (blocos), tudo fora do vão; a borda que encosta no vidro
  // fica mais escura (faz o papel do contorno, que não entra no vão).
  const borda = (px: number, py: number) => vao(px - 1, py, 0) || vao(px + 1, py, 0) || vao(px, py - 1, 0) || vao(px, py + 1, 0);
  for (let py = y - 3; py < y + h; py++) {
    for (let px = x - 1; px < x + w + 1; px++) {
      if (!vao(px, py, 3) || vao(px, py, 0)) continue;
      let c = p.base;
      if (py < ys) {
        const ang = Math.atan2(ys - py, px + 0.5 - cx);
        const k = Math.floor((ang / Math.PI) * 9);
        c = k % 2 ? p.lt : p.base;
        if (k === 4) c = p.hi;
      } else {
        c = Math.floor((py - ys) / 4) % 2 ? p.lt : p.base;
        if ((py - ys) % 4 === 3) c = p.dk;
      }
      b.set(px, py, borda(px, py) ? p.dd : c);
    }
  }
  // Fecho de ouro no alto do arco.
  b.rect(Math.floor(cx) - 1, y - 3, 2, 3, N.ouro.base);
  b.set(Math.floor(cx) - 1, y - 3, N.ouro.hi);
  // Peitoril de pedra.
  b.rect(x - 1, y + h, w + 2, 2, p.lt);
  b.hline(x - 1, x + w, y + h, p.hi);
  b.hline(x - 1, x + w, y + h + 1, p.dk);
  // Contorno com o vão mascarado (senão ele ganha borda escura por dentro e tapa o céu).
  for (let py = gy; py < gy + gh; py++) for (let px = gx; px < gx + gw; px++) if (vao(px, py, 0)) b.set(px, py, '#000000');
  b.outline();
  for (let py = gy; py < gy + gh; py++) for (let px = gx; px < gx + gw; px++) if (vao(px, py, 0)) b.clear(px, py);
  // Montante e travessa de ferro (1 px) sobre o vidro.
  const f = N.ferro;
  for (let py = gy; py < gy + gh; py++) if (vao(Math.floor(cx), py, 0)) b.set(Math.floor(cx), py, f.base);
  b.hline(gx, gx + gw - 1, ys, f.base);
  b.set(Math.floor(cx), ys, f.lt);
  // Reflexos no vidro, só dentro do vão.
  for (const off of [3, 16]) {
    for (let i = 0; i < gh; i++) {
      const px = gx + off + 6 - Math.round((i * 6) / gh);
      const py = gy + i;
      if (vao(px, py, 0) && b.alpha(px, py) === 0) b.set(px, py, 'rgba(255,255,255,0.26)');
      if (vao(px + 1, py, 0) && b.alpha(px + 1, py) === 0) b.set(px + 1, py, 'rgba(255,255,255,0.14)');
    }
  }
  sombraParede(b, x - 1, y - 2, w + 2, h + 4);
  s.rects = { glass: rectAt(s, gx, gy, gw, gh) };
  return { base: s };
}

// ------------------------------------------------------------------ disco de sol e lua

/** Disco de sol e lua: raios de ouro em cima, a lua crescente de prata embalando o mostrador de marfim embaixo. */
export function discoSolLua(): BufFurniture {
  const s = wallSheet(1);
  const b = s.buf;
  const cx = 8;
  const cy = -21.5;
  const ouro = N.ouro;
  const prata = ramp('#b4bfcf', 0.07);
  // Raios do sol (cinco pontas largas e pontos entre elas).
  for (const deg of [198, 234, 270, 306, 342]) {
    const a = (deg * Math.PI) / 180;
    for (let d = 6.2; d <= 9.2; d += 0.4) {
      const half = d < 7.5 ? 0.9 : 0.4;
      for (let k = -half; k <= half; k += 0.5) {
        b.set(Math.floor(cx + Math.cos(a) * d - Math.sin(a) * k), Math.floor(cy + Math.sin(a) * d + Math.cos(a) * k), d > 8 ? ouro.base : ouro.lt);
      }
    }
  }
  for (const deg of [216, 252, 288, 324]) {
    const a = (deg * Math.PI) / 180;
    b.set(Math.floor(cx + Math.cos(a) * 7.4), Math.floor(cy + Math.sin(a) * 7.4), ouro.dk);
  }
  // Aro de ouro em cima e a lua crescente embaixo (mais grossa no meio, afinando até as pontas).
  for (let py = Math.floor(cy - 8); py <= Math.ceil(cy + 8); py++) {
    for (let px = Math.floor(cx - 8); px <= Math.ceil(cx + 8); px++) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      const outer = dy > 0 ? 6.4 + 1.6 * (dy / d) : 6.4;
      if (d > outer) continue;
      const m: Ramp = dy < 0 ? ouro : prata;
      b.set(px, py, d > outer - 0.9 ? m.dk : dx + dy < -3 ? m.hi : m.lt);
    }
  }
  // Mostrador de marfim com as marcas das horas.
  b.ellipse(cx, cy, 4.9, 4.9, '#f1e7cd');
  b.set(cx - 2, cy - 3.5, '#ffffff');
  for (const [x, y] of [[7, -26], [8, -26], [7, -18], [8, -18], [3, -22], [12, -22]] as const) b.set(x, y, SEPIA);
  b.outline();
  sombraParede(b, -1, -31, 18, 19);
  s.rects = { face: rectAt(s, 3, -27, 10, 10) };
  return { base: s };
}

// ------------------------------------------------------------------ escudos (pôsteres)

/** Campo do escudo: tábuas sob a pintura (`pinta` decide a cor de cada pixel) e aro de ferro. */
function escudo(b: PixelBuf, cx: number, cy: number, r: number, pinta: (dx: number, dy: number) => string): void {
  const f = N.ferro;
  for (let py = Math.floor(cy - r); py <= Math.ceil(cy + r); py++) {
    for (let px = Math.floor(cx - r); px <= Math.ceil(cx + r); px++) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d > r) continue;
      if (d > r - 1) {
        b.set(px, py, dx + dy < -3 ? f.lt : f.base);
        continue;
      }
      let c = pinta(dx, dy);
      if ((px - Math.floor(cx - r)) % 4 === 0) c = shade(c, -0.05);
      if (dx + dy < -r * 0.9) c = shade(c, 0.06);
      b.set(px, py, c);
    }
  }
}

/** Bossa de ferro (ou ouro) no centro do escudo. */
function bossa(b: PixelBuf, cx: number, cy: number, m: Ramp = N.ferro): void {
  b.ellipse(cx, cy, 1.7, 1.7, m.base);
  b.set(Math.floor(cx - 1), Math.floor(cy - 1), m.hi);
  b.set(Math.floor(cx), Math.floor(cy), m.dk);
}

/** Escudo redondo pintado: runas, espiral, raio de Thor, gato de Freyja, serpente do mundo ou drakkar. */
export function escudoParede(variant: string | undefined): BufFurniture {
  const s = wallSheet(1);
  const b = s.buf;
  const cx = 8;
  const cy = -21;
  const R = 7.5;
  switch (variant ?? 'code') {
    case 'coffee': {
      // Espiral de três braços (vermelho sobre creme).
      escudo(b, cx, cy, R, (dx, dy) => {
        const t = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * 3 + Math.hypot(dx, dy) * 0.22;
        return t % 1 < 0.5 ? '#a8302b' : '#ead9b8';
      });
      bossa(b, cx, cy, N.ouro);
      break;
    }
    case 'rocket': {
      // O raio de Thor atravessando um campo de tempestade.
      escudo(b, cx, cy, R, (dx, dy) => (dy < -dx * 0.3 ? '#2c4067' : '#22324f'));
      b.stamp(['....yy', '...yy.', '..yyyy', '....y.', '...y..', '..y...'], cx - 4, cy - 5, { y: '#f2c94c' });
      b.stamp(['y', 'y'], cx - 2, cy + 1, { y: '#f2c94c' });
      bossa(b, cx + 2, cy + 3);
      break;
    }
    case 'cat': {
      // Gato de Freyja: orelhas, olhos e bigodes; a bossa é o focinho.
      escudo(b, cx, cy, R, () => '#3d6b45');
      const o = '#e8b84a';
      b.stamp(['o....o', 'oo..oo', 'oooooo'], cx - 3, cy - 6, { o });
      b.rect(cx - 3, cy - 3, 6, 5, o);
      b.set(cx - 2, cy - 2, '#2a2a36');
      b.set(cx + 1, cy - 2, '#2a2a36');
      for (const yy of [cy, cy + 1]) {
        b.hline(cx - 6, cx - 4, yy, '#f4ecd8');
        b.hline(cx + 3, cx + 5, yy, '#f4ecd8');
      }
      bossa(b, cx, cy, N.ouro);
      break;
    }
    case 'bug': {
      // Jörmungandr, a serpente do mundo, mordendo a própria cauda.
      escudo(b, cx, cy, R, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        return d > 3 && d < 5 ? '#3f7a45' : '#d9a441';
      });
      b.set(cx + 2, cy - 5, '#2a5a35');
      b.set(cx + 3, cy - 5, '#2a5a35');
      b.set(cx + 3, cy - 4, '#f4ecd8');
      b.set(cx + 4, cy - 4, '#2a5a35');
      bossa(b, cx, cy);
      break;
    }
    case 'ship_it': {
      // Drakkar no mar sob o sol (a bossa de ouro é o sol).
      escudo(b, cx, cy, R, (_dx, dy) => (dy < 1.5 ? '#7fb0d0' : dy < 3 ? '#3f6f98' : '#2f557a'));
      b.stamp(['h........h', '.hhhhhhhh.'], cx - 5, cy + 1, { h: '#5a3a26' });
      b.set(cx - 5, cy, '#5a3a26');
      b.set(cx + 4, cy, '#5a3a26');
      b.vline(cx, cy - 6, cy, '#5a3a26');
      b.stamp(['rwr', 'rwr', 'rwr'], cx - 1, cy - 5, { r: '#b8402f', w: '#f4ecd8' });
      bossa(b, cx - 4, cy - 4, N.ouro);
      break;
    }
    default: {
      // Runas de ouro nos quatro pontos, em campo azul.
      escudo(b, cx, cy, R, () => '#2f4f7e');
      runinha(b, cx - 1, cy - 6, 0, N.ouro.lt);
      runinha(b, cx - 1, cy + 3, 3, N.ouro.lt);
      runinha(b, cx - 6, cy - 1, 1, N.ouro.lt);
      runinha(b, cx + 3, cy - 1, 4, N.ouro.lt);
      bossa(b, cx, cy, N.ouro);
      break;
    }
  }
  b.outline();
  sombraParede(b, 0, -29, 16, 16);
  return { base: s };
}

// ------------------------------------------------------------------ tapeçaria

/** Tapeçaria pendurada num varão, com barra tecida e franja. rects.art = a cena tecida (pode receber arte de IA). */
export function tapecaria(seed: number): BufFurniture {
  const s = wallSheet(2);
  const b = s.buf;
  const w = N.carvalho;
  const x = 3;
  const y = -28;
  const W = 26;
  const H = 18;
  const ax = x + 2;
  const ay = y + 3;
  const aw = W - 4;
  const ah = 13;
  const barra = seed % 2 ? ramp('#2f4a7a', 0.07) : ramp('#8e2433', 0.07);
  // Varão com pomos e presilhas.
  b.rect(x - 2, y - 2, W + 4, 2, w.base);
  b.hline(x - 2, x + W + 1, y - 2, w.lt);
  pomo(b, x - 4, y - 2);
  pomo(b, x + W + 2, y - 2);
  // Pano: barra com ziguezague de ouro, cena no meio.
  b.rect(x, y, W, H, barra.base);
  b.vline(x, y, y + H - 1, barra.lt);
  b.vline(x + W - 1, y, y + H - 1, barra.dk);
  for (let xx = x; xx < x + W; xx++) {
    b.set(xx, y + 1 + (xx % 2), N.ouro.base);
    b.set(xx, y + H - 2 + ((xx + 1) % 2) - 1, N.ouro.dk);
  }
  for (let xx = x + 1; xx < x + W; xx += 4) b.set(xx, y, w.dk);
  if (seed % 2 === 0) {
    // Yggdrasil sob as estrelas.
    for (let i = 0; i < ah; i++) b.hline(ax, ax + aw - 1, ay + i, mix('#1f2c4f', '#2f5a5a', i / ah));
    for (const [sx, sy] of [[2, 1], [6, 3], [18, 2], [20, 5], [13, 1], [3, 6]] as const) b.set(ax + sx, ay + sy, '#f4e9c8');
    const tx = ax + Math.floor(aw / 2);
    b.rect(tx - 1, ay + 6, 2, 6, '#7a5236');
    b.line(tx - 1, ay + 11, tx - 5, ay + 12, '#7a5236');
    b.line(tx, ay + 11, tx + 5, ay + 12, '#7a5236');
    b.ellipse(tx, ay + 4.5, 7.5, 3.6, '#3f7a45');
    b.ellipse(tx - 1, ay + 3.8, 5.5, 2.4, '#5f9a52');
    for (const [dx, dy] of [[-4, 4], [3, 3], [-1, 2], [5, 5]] as const) b.set(tx + dx, ay + dy, N.ouro.lt);
    b.hline(ax, ax + aw - 1, ay + ah - 1, '#2a3d3a');
  } else {
    // Drakkar sob a aurora.
    for (let i = 0; i < ah; i++) b.hline(ax, ax + aw - 1, ay + i, i < 9 ? mix('#16203f', '#24345e', i / 9) : '#1f3f62');
    for (let xx = 0; xx < aw; xx++) {
      const yy = ay + 2 + Math.round(Math.sin(xx * 0.45) * 1.2);
      b.set(ax + xx, yy, '#5fd38a');
      b.set(ax + xx, yy + 1, 'rgba(95,211,138,0.45)');
    }
    for (let xx = 0; xx < aw; xx++) {
      const hh = Math.round(2 + Math.sin(xx * 0.6 + 1) * 1.5);
      b.vline(ax + xx, ay + 8 - hh, ay + 8, '#2a2f45');
    }
    for (let xx = 1; xx < aw; xx += 4) b.hline(ax + xx, ax + xx + 1, ay + 11, '#7fb0d0');
    const sx = ax + 8;
    b.hline(sx, sx + 8, ay + 9, '#5a3a26');
    b.hline(sx + 1, sx + 7, ay + 10, '#4a2e1e');
    b.set(sx - 1, ay + 8, '#5a3a26');
    b.set(sx - 1, ay + 7, N.ouro.base);
    b.set(sx + 9, ay + 8, '#5a3a26');
    b.vline(sx + 4, ay + 3, ay + 8, '#5a3a26');
    b.rect(sx + 2, ay + 4, 5, 4, '#b8402f');
    b.vline(sx + 3, ay + 4, ay + 7, '#f4ecd8');
    b.vline(sx + 5, ay + 4, ay + 7, '#f4ecd8');
  }
  // Franja.
  for (let xx = x + 1; xx < x + W - 1; xx += 2) b.vline(xx, y + H, y + H + 1, barra.dk);
  b.outline();
  sombraParede(b, x - 1, y - 1, W + 2, H + 3);
  s.rects = { art: rectAt(s, ax, ay, aw, ah) };
  return { base: s };
}

// ------------------------------------------------------------------ placa entalhada

/** Tábua entalhada com pontas em espiral e argolas; o miolo é escuro, então o nome sai claro por cima. */
export function placaEntalhada(): BufFurniture {
  const s = wallSheet(3);
  const b = s.buf;
  const w = N.carvalho;
  const x = 3;
  const y = -28;
  const W = 42;
  const H = 11;
  b.rect(x, y, W, H, w.base);
  b.hline(x, x + W - 1, y, w.hi);
  b.hline(x, x + W - 1, y + 1, w.lt);
  b.hline(x, x + W - 1, y + H - 1, w.dd);
  b.vline(x, y, y + H - 1, w.lt);
  b.vline(x + W - 1, y, y + H - 1, w.dk);
  // Miolo rebaixado (escuro) com veio leve.
  const m = ramp('#4a3226', 0.05);
  b.rect(x + 2, y + 2, W - 4, H - 4, m.base);
  b.hline(x + 2, x + W - 3, y + 2, m.dk);
  const r = rngOf(29, 4);
  for (let i = 0; i < 18; i++) b.hline(x + 3 + Math.floor(r() * (W - 10)), x + 5 + Math.floor(r() * (W - 10)), y + 3 + Math.floor(r() * (H - 5)), m.lt);
  // Pontas em espiral (cabeças de dragão estilizadas), olhando para fora.
  const espiral = ['.ww.', 'w..w', 'w.ww', 'w...', '.ww.'];
  b.stamp(espiral, x - 4, y + 3, { w: w.base }, true);
  b.stamp(espiral, x + W, y + 3, { w: w.base });
  b.set(x - 3, y + 5, N.ouro.lt);
  b.set(x + W + 2, y + 5, N.ouro.lt);
  // Pregos de ouro e argolas de ferro em cima.
  for (const xx of [x + 2, x + W - 3]) {
    b.set(xx, y + 2, N.ouro.lt);
    b.set(xx, y + H - 3, N.ouro.lt);
  }
  for (const xx of [x + 6, x + W - 7]) {
    b.set(xx - 1, y - 2, N.ferro.lt);
    b.set(xx + 1, y - 2, N.ferro.lt);
    b.set(xx, y - 3, N.ferro.lt);
    b.set(xx, y - 1, N.ferro.base);
  }
  b.outline();
  sombraParede(b, x - 1, y - 1, W + 2, H + 2);
  s.rects = { sign: rectAt(s, x + 4, y + 2, W - 8, H - 4) };
  return { base: s };
}

// ------------------------------------------------------------------ tocha (interruptor)

/**
 * Tocha num suporte de ferro: 'on' acesa, 'off' apagada com um fio de fumaça. Compacta para caber na mureta; a
 * fumaça ocupa a mesma caixa da chama porque, na mureta, o mundo centraliza o item pelos pixels visíveis (assim a
 * tocha não pula quando a luz da sala muda).
 */
export function tocha(variant: string | undefined): BufFurniture {
  const s = wallSheet(1);
  const b = s.buf;
  const on = (variant ?? 'on') === 'on';
  const f = N.ferro;
  const w = N.pinho;
  // Placa de ferro presa na parede e o aro que segura o cabo.
  b.rect(6, -15, 4, 4, f.base);
  b.hline(6, 9, -15, f.lt);
  b.hline(6, 9, -12, f.dk);
  rebite(b, 6, -13);
  rebite(b, 9, -13);
  b.rect(7, -18, 2, 7, w.base);
  b.vline(7, -18, -12, w.lt);
  b.hline(6, 9, -16, f.lt);
  b.set(9, -16, f.dk);
  // Cabeça enrolada em pano com breu.
  b.rect(6, -20, 4, 2, on ? '#5a3a26' : '#2a2220');
  b.hline(6, 9, -20, on ? '#7a5236' : '#3a302c');
  if (!on) {
    b.set(7, -20, '#8a2a1a');
    b.set(9, -19, '#5a1a12');
  }
  b.outline();
  if (on) chamaTocha(b, 5, -26);
  else {
    const fumo: [number, number, number][] = [[8, -21, 0.45], [7, -22, 0.4], [7, -23, 0.35], [8, -24, 0.3], [9, -25, 0.2], [6, -25, 0.18], [5, -26, 0.14], [9, -26, 0.12]];
    for (const [xx, yy, a] of fumo) b.set(xx, yy, `rgba(176,176,176,${a})`);
  }
  return { base: s };
}

// ------------------------------------------------------------------ arco entalhado (batente)

/** Arco entalhado sobre a passagem: postes com corda torcida em bases de pedra, arco com fecho de ouro e verga. */
export function arcoEntalhado(): BufFurniture {
  const s = wallSheet(2, 3);
  const b = s.buf;
  const w = N.carvalho;
  const p = N.pedra;
  // Postes (4 px) com corda torcida, sobre bases de pedra.
  for (const [x0, flip] of [[-3, false], [31, true]] as const) {
    b.rect(x0, -26, 4, 22, w.base);
    if (flip) {
      frisoV(b, x0, -24, 19, w, 2);
      b.vline(x0 + 3, -26, -5, w.dd);
    } else {
      b.vline(x0, -26, -5, w.lt);
      frisoV(b, x0 + 1, -24, 19, w);
    }
    b.rect(x0 - 1, -4, 6, 4, p.base);
    b.hline(x0 - 1, x0 + 4, -4, p.lt);
    b.vline(x0 + 4, -4, -1, p.dk);
  }
  // Arco (tímpano entalhado entre a curva e a verga).
  for (let py = -29; py <= -21; py++) {
    for (let px = 1; px <= 30; px++) {
      const dx = (px + 0.5 - 16) / 15;
      const dy = (py + 0.5 + 21) / 7.5;
      const d = dx * dx + dy * dy;
      if (d < 1) continue;
      b.set(px, py, d < 1.18 ? w.lt : (px + py) % 5 === 0 ? w.dk : w.base);
    }
  }
  // Verga com corda torcida, pontas em espiral e o fecho de ouro.
  b.rect(-3, -32, 38, 3, w.base);
  b.hline(-3, 34, -32, w.hi);
  friso(b, 2, -31, 28, w, 1);
  b.hline(-3, 34, -29, w.dk);
  b.rect(14, -30, 4, 3, N.ouro.base);
  b.hline(14, 17, -30, N.ouro.hi);
  b.set(15, -28, N.ouro.dk);
  b.set(16, -28, N.ouro.dk);
  b.outline();
  return { base: s };
}

// ------------------------------------------------------------------ chifres de beber

/** Prateleira de parede com chifres de beber (3 arranjos pela semente). */
export function prateleiraChifres(seed: number): BufFurniture {
  const s = wallSheet(2);
  const b = s.buf;
  const w = N.carvalho;
  const v = seed % 3;
  const tabua = (y: number) => {
    b.rect(1, y, 30, 2, w.lt);
    b.hline(1, 30, y, w.hi);
    b.hline(1, 30, y + 1, w.dk);
    for (const x of [4, 26]) {
      b.rect(x, y + 2, 2, 2, N.ferro.base);
      b.set(x, y + 2, N.ferro.lt);
    }
  };
  if (v === 1) {
    // Dois chifres grandes cruzados, pendurados por tiras de couro, e canecas na tábua.
    for (const px of [9, 22]) {
      b.set(px, -27, N.ferro.lt);
      b.vline(px, -26, -24, N.couro.dk);
    }
    chifre(b, 3, -25, 13, false);
    chifre(b, 16, -25, 13, true);
    tabua(-12);
    caneca(b, 6, -18);
    caneca(b, 13, -18, N.carvalho);
    caneca(b, 21, -18);
  } else if (v === 2) {
    // Dois chifres em suportes de ferro e a jarra de hidromel no meio.
    tabua(-12);
    for (const [hx, flip] of [[2, false], [19, true]] as const) {
      b.vline(hx + 2, -15, -13, N.ferro.base);
      b.vline(hx + 8, -16, -13, N.ferro.base);
      b.hline(hx + 1, hx + 3, -13, N.ferro.dk);
      b.hline(hx + 7, hx + 9, -13, N.ferro.dk);
      chifre(b, hx, -20, 11, flip);
    }
    const j = ramp('#a86a44', 0.07);
    b.rect(14, -19, 5, 7, j.base);
    b.vline(14, -19, -13, j.lt);
    b.vline(18, -19, -13, j.dk);
    b.hline(15, 17, -20, j.dk);
    b.hline(14, 18, -16, '#e8d7b0');
    b.set(19, -18, j.dk);
    b.set(19, -17, j.dk);
  } else {
    // Três chifres deitados na tábua e um odre de couro pendurado.
    tabua(-12);
    chifre(b, 2, -17, 10, false);
    chifre(b, 12, -17, 10, true);
    chifre(b, 18, -22, 7, false);
    b.line(26, -26, 26, -22, N.couro.dk);
    b.rect(25, -22, 4, 5, N.couro.base);
    b.vline(25, -22, -18, N.couro.lt);
    b.set(28, -18, N.couro.dk);
    b.set(26, -27, N.ferro.lt);
  }
  b.outline();
  return { base: s };
}

// ------------------------------------------------------------------ estandarte

const PANOS: Readonly<Record<string, { pano: string; emblema: string; barra: string }>> = {
  red: { pano: '#8e2433', emblema: '#24202a', barra: '#d6a335' },
  blue: { pano: '#2f4a7a', emblema: '#d8dde6', barra: '#d6a335' },
  green: { pano: '#2f6040', emblema: '#e0b84a', barra: '#e8dcc0' },
  gold: { pano: '#c9962e', emblema: '#5a1e1a', barra: '#5a1e1a' },
};

/** Estandarte de pano num varão, com rabo de andorinha e um símbolo: corvo, Mjölnir, Yggdrasil ou valknut. */
export function estandarte(variant: string | undefined): BufFurniture {
  const s = wallSheet(1);
  const b = s.buf;
  const v = variant && PANOS[variant] ? variant : 'red';
  const c = PANOS[v];
  const m = ramp(c.pano, 0.07);
  const w = N.carvalho;
  // Varão com pomos e cordões.
  b.rect(1, -30, 14, 2, w.base);
  b.hline(1, 14, -30, w.lt);
  pomo(b, -1, -30);
  pomo(b, 15, -30);
  // Pano com dobras e barra; rabo de andorinha embaixo.
  b.rect(3, -28, 10, 16, m.base);
  for (const x of [5, 10]) b.vline(x, -28, -13, m.dk);
  b.vline(3, -28, -13, m.lt);
  b.vline(12, -28, -13, m.dd);
  b.hline(3, 12, -28, m.dk);
  b.stamp(['bbbb..bbbb', 'bbb....bbb', 'bb......bb'], 3, -12, { b: m.base });
  b.vline(4, -27, -11, c.barra);
  b.vline(11, -27, -11, c.barra);
  // Símbolo.
  const e = c.emblema;
  if (v === 'blue') {
    b.stamp(['hhhhh', 'hhhhh', '.hhh.', '..s..', '..s..', '..s..', '..g..'], 5, -25, { h: e, s: '#8a5a36', g: N.ouro.lt });
  } else if (v === 'green') {
    b.stamp(['.eee.', 'eeeee', 'eeeee', '..e..', '..e..', '.e.e.', 'e...e'], 5, -25, { e });
  } else if (v === 'gold') {
    b.stamp(['..e...', '.e.e..', 'eeeee.', '.e.e.e', '..eeeee', '...e.e.', '....e..'], 4, -25, { e });
  } else {
    b.stamp(['...ee.', '..eeeo', '.eeee.', 'eeeee.', '..ee..', '.e..e.'], 5, -24, { e, o: N.ouro.lt });
  }
  b.outline();
  sombraParede(b, 2, -29, 12, 20);
  return { base: s };
}
