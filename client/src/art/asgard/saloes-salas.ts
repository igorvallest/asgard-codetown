// Asgard, salas próprias: o poço de Mímir (com o brilho verde-azulado da água da sabedoria), o tear de Frigg com o
// pano azul de nuvens e a roca de fiar. Mesmo estilo dos salões: coordenadas de desenho = footprint.
import { ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, type BufFurniture } from '../core/sprite';
import { contact } from '../furniture/kit';
import { N, halo, rune } from './saloes-kit';

const W = N.wood;
/** Água do poço: funda nas bordas, clara no meio. */
const WELL = { deep: '#1d5f6a', mid: '#2c9c9c', lt: '#58d8c8', hi: '#b8fff0', glow: '#5fe8d0' } as const;
const ROOT = ramp('#5a4030', 0.07);

/** Raiz retorcida (2 px de espessura) de (x0, y0) a (x1, y1), com o lado de cima iluminado. */
function root(b: PixelBuf, x0: number, y0: number, x1: number, y1: number): void {
  b.line(x0, y0 + 1, x1, y1 + 1, ROOT.dk);
  b.line(x0, y0, x1, y1, ROOT.base);
  b.set(x0, y0, ROOT.lt);
}

/**
 * Poço de Mímir (2x2): mureta redonda de pedra com runas, a água que brilha verde-azulada, raízes de Yggdrasil
 * mergulhando nela e o Gjallarhorn apoiado na borda. Baixo (quem senta ao norte continua à mostra).
 * rects.glow = centro da água.
 */
export function well(): BufFurniture {
  const s = floorSheet(2, 2, 10);
  const b = s.buf;
  const st = N.stone;
  const cx = 16;
  const cy = 14;
  const rx = 13;
  const ry = 8;
  const rimY = (x: number) => cy + ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2));
  // Mureta (cilindro): face da frente descendo da borda, luz à esquerda e sombra à direita.
  for (let x = cx - rx; x < cx + rx; x++) {
    const y0 = Math.round(rimY(x));
    const t = (x + 0.5 - (cx - rx)) / (2 * rx);
    const c = t < 0.22 ? st.lt : t > 0.78 ? st.dk : st.base;
    b.vline(x, cy, y0 + 7, c);
    b.set(x, y0 + 7, st.dd);
    // Fiada do meio e juntas desencontradas.
    b.set(x, y0 + 3, st.dk);
    if ((x - 3) % 5 === 0) b.vline(x, y0 + 1, y0 + 2, st.dk);
    if ((x - 5) % 5 === 0) b.vline(x, y0 + 4, y0 + 6, st.dk);
  }
  // Runas entalhadas na frente da mureta.
  for (const [i, x] of [[0, 7], [3, 12], [5, 18], [2, 23]] as const) rune(b, x, Math.round(rimY(x + 1)) + 1, i, '#2f6f6a');
  // Borda (anel de pedra) e a parede de dentro, escura, acima da água.
  b.ellipse(cx, cy, rx, ry, st.lt);
  b.ellipse(cx - 0.5, cy - 0.6, rx - 1, ry - 1, st.hi);
  b.ellipse(cx, cy, rx - 2, ry - 2.2, st.base);
  b.ellipse(cx, cy + 0.4, rx - 3, ry - 3, N.slate.dd);
  // Água: funda na borda, clara no meio.
  b.ellipse(cx, cy + 1.4, rx - 3.5, ry - 4, WELL.deep);
  b.ellipse(cx, cy + 1.6, rx - 5, ry - 5, WELL.mid);
  b.ellipse(cx, cy + 1.6, rx - 8, ry - 6.4, WELL.lt);
  // Raízes de Yggdrasil vindo de trás, por cima da borda, até a água; e uma abraçando a base.
  root(b, 4, 4, 9, 10);
  root(b, 9, 4, 12, 12);
  root(b, 25, 3, 21, 11);
  b.set(5, 3, ROOT.base);
  b.set(26, 2, ROOT.base);
  root(b, 1, 25, 6, 29);
  root(b, 29, 23, 26, 29);
  // Gjallarhorn apoiado na borda da frente, à direita.
  b.stamp(['gG.....', 'Dcccuut', '.ccuut.'], 20, 19, { g: N.gold.base, G: N.gold.hi, D: '#3a2a1e', c: '#efe2c4', u: '#c9a46a', t: '#6e4a2e' });
  b.outline();
  contact(b, 2, 27, 28, 6, 0.24);
  // Brilho (depois do contorno): luz na água, reflexos e as runas acesas de leve.
  halo(b, cx, cy + 1.5, 14, WELL.glow, 0.3);
  for (const [x, y] of [[13, 15], [18, 14], [16, 16], [20, 16]] as const) b.set(x, y, WELL.hi);
  for (const [i, x] of [[0, 7], [3, 12], [5, 18], [2, 23]] as const) rune(b, x, Math.round(rimY(x + 1)) + 1, i, 'rgba(111,240,216,0.55)');
  s.rects = { glow: rectAt(s, cx - 4, cy - 1, 8, 6) };
  return { base: s };
}

/** Cesto de vime com novelos de lã. (x, y) = canto superior esquerdo da boca do cesto. */
function basket(b: PixelBuf, x: number, y: number, wools: readonly string[]): void {
  const v = ramp('#b8925a', 0.07);
  wools.forEach((c, i) => {
    b.ellipse(x + 2 + i * 2.6, y, 1.8, 1.6, c);
    b.set(x + 1 + i * 2.6, y - 1, '#ffffff');
  });
  b.rect(x, y + 1, 9, 5, v.base);
  b.hline(x, x + 8, y + 1, v.hi);
  for (let yy = y + 2; yy < y + 6; yy++) for (let xx = x + ((yy + 1) % 2); xx < x + 9; xx += 2) b.set(xx, yy, v.dk);
  b.hline(x + 1, x + 7, y + 5, v.dd);
}

/**
 * Tear de Frigg (2x2): tear de pé com pesos, o pano azul de nuvens enrolado na travessa de cima e descendo pelo
 * meio, os fios da urdidura amarrados aos pesos de pedra e dois cestos de lã no chão.
 */
export function loom(): BufFurniture {
  const s = floorSheet(2, 2, 22);
  const b = s.buf;
  const sky = ramp('#4a78b8', 0.07);
  // Montantes com pés e a travessa dos fios.
  for (const x of [2, 27]) {
    b.rect(x, -18, 3, 44, W.base);
    b.vline(x, -18, 25, W.lt);
    b.vline(x + 2, -18, 25, W.dd);
    b.rect(x - 2, 24, 7, 3, W.dk);
    b.hline(x - 2, x + 4, 24, W.base);
  }
  // Fios da urdidura (do pano até os pesos) e a vara de liço atravessada.
  for (let x = 6; x <= 25; x += 2) b.vline(x, 6, 16, '#e6dcc4');
  b.rect(1, 9, 30, 2, W.lt);
  b.hline(1, 30, 10, W.dk);
  // Pesos de pedra (rosquinhas) pendurados em fileira.
  for (let x = 6; x <= 24; x += 3) {
    b.rect(x, 17, 3, 3, N.stone.base);
    b.set(x, 17, N.stone.hi);
    b.set(x + 1, 18, N.slate.dd);
    b.set(x + 2, 19, N.stone.dk);
  }
  // Pano azul de nuvens descendo da travessa de cima.
  b.rect(5, -15, 22, 21, sky.base);
  b.vline(5, -15, 5, sky.lt);
  b.vline(26, -15, 5, sky.dk);
  for (let x = 5; x <= 26; x += 2) b.set(x, 6, sky.dk);
  for (const [cx, cy, w] of [[11, -10, 4], [20, -6, 5], [9, -1, 3], [22, 2, 3], [15, -2, 3]] as const) {
    b.ellipse(cx, cy, w, 1.6, '#c8d8ee');
    b.ellipse(cx - 0.6, cy - 0.5, w - 1, 1.3, '#f2f6fc');
    b.ellipse(cx + w * 0.4, cy - 1.2, w * 0.45, 1, '#f2f6fc');
  }
  // Travessa de cima com o pano enrolado.
  b.rect(0, -20, 32, 5, sky.dk);
  b.hline(0, 31, -20, sky.lt);
  b.hline(0, 31, -19, sky.base);
  for (let x = 2; x < 31; x += 3) b.set(x, -18, sky.dd);
  for (const x of [0, 30]) {
    b.rect(x, -21, 2, 7, W.base);
    b.set(x, -21, W.hi);
  }
  // Cestos de lã no chão, na frente dos pés.
  basket(b, -2, 26, ['#f4f2ee', '#4a78b8']);
  basket(b, 25, 26, ['#c8ccd2', '#f4f2ee']);
  b.outline();
  contact(b, -2, 28, 36, 5, 0.24);
  return { base: s };
}

/** Roca de fiar: roda raiada sobre o banco inclinado de três pés, pedal e a roca com lã branca. */
export function spinningWheel(): BufFurniture {
  const s = floorSheet(1, 1, 16);
  const b = s.buf;
  const cx = 6;
  const cy = -3;
  // Banco inclinado e os três pés.
  b.line(0, 6, 15, 3, W.base, 2);
  b.line(0, 6, 15, 3, W.lt);
  for (const [x0, x1] of [[1, 0], [13, 15], [8, 9]] as const) b.line(x0, 7, x1, 14, W.dk);
  // Pedal.
  b.rect(3, 12, 6, 2, W.base);
  b.hline(3, 8, 12, W.lt);
  b.line(6, 12, 6, 2, W.dd);
  // Roda: aro de madeira, raios e cubo.
  for (let a = 0; a < 64; a++) {
    const ang = (a / 64) * Math.PI * 2;
    b.set(Math.round(cx + Math.cos(ang) * 6), Math.round(cy + Math.sin(ang) * 6), Math.sin(ang) < -0.3 ? W.lt : W.base);
  }
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * Math.PI + 0.4;
    b.line(Math.round(cx - Math.cos(ang) * 5), Math.round(cy - Math.sin(ang) * 5), Math.round(cx + Math.cos(ang) * 5), Math.round(cy + Math.sin(ang) * 5), W.dk);
  }
  b.rect(cx - 1, cy - 1, 2, 2, N.gold.base);
  // Suporte da roda e a roca (vara com o chumaço de lã branca no alto).
  b.line(cx, cy + 1, cx - 1, 5, W.dk);
  b.vline(13, -9, 3, W.dk);
  b.ellipse(13, -11, 3, 3.5, '#ece8de');
  b.ellipse(12.4, -12, 2, 2.2, '#ffffff');
  b.set(14, -9, '#c9c3b6');
  b.set(11, -13, '#ffffff');
  // Fio indo da lã até a roda.
  b.line(11, -8, cx + 3, cy - 4, 'rgba(244,240,230,0.9)');
  b.outline();
  contact(b, -1, 12, 18, 4, 0.22);
  return { base: s };
}
