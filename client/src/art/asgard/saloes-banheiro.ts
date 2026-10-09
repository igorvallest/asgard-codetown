// Asgard, banheiro: latrina de tábuas com porta de ferragens, bacia de pedra e espelho de bronze polido.
// Mesmas pegadas, estados, `front` e regiões do banheiro do Escritório (furniture/common.ts e wall.ts).
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, wallSheet, type BufFurniture } from '../core/sprite';
import { contact, frontFace, topFace, underRect } from '../furniture/kit';
import { N, WATER, planks, recess, rune, stud, wallShadow } from './saloes-kit';

/** Ferragem de dobradiça: cinta de ferro com a ponta em lança. */
function hinge(b: PixelBuf, x: number, y: number, len: number): void {
  b.hline(x, x + len - 1, y, N.iron.lt);
  b.hline(x, x + len - 2, y + 1, N.iron.dk);
  b.set(x + len, y, N.iron.base);
  b.set(x + 1, y, N.iron.hi);
}

/**
 * Latrina de madeira (2x2): divisórias de tábuas, banco com o buraco e balde dentro. O `front` é a parede da
 * frente com a porta. state 0 = livre (porta entreaberta, runa verde), 1 = ocupada (porta fechada, runa vermelha).
 */
export function toiletStall(state: number): BufFurniture {
  const occupied = state >= 1;
  const wall = N.plank;
  const s = floorSheet(2, 2, 26, 3, 4);
  const b = s.buf;
  // Fundo de tábuas na sombra.
  b.rect(3, -21, 26, 13, N.woodDark.base);
  for (let x = 6; x < 28; x += 4) b.vline(x, -21, -9, N.woodDark.dk);
  b.hline(3, 28, -9, N.woodDark.dd);
  // A tampa redonda pendurada num pino da parede, acima do buraco.
  b.set(16, -19, N.iron.hi);
  b.ellipse(16, -15.5, 3, 3, wall.base);
  b.ellipse(15.6, -16, 2.2, 2.2, wall.lt);
  b.hline(15, 17, -13, wall.dk);
  // Banco da latrina de parede a parede: tampo com o buraco e frente de tábuas.
  topFace(b, 3, -8, 26, 5, wall);
  b.ellipse(16, -6, 2.8, 1.3, '#241a14');
  b.hline(15, 17, -7, '#3a2a20');
  frontFace(b, 3, -3, 26, 6, N.wood);
  for (const x of [8, 13, 19, 24]) b.vline(x, -3, 2, N.wood.dk);
  // Balde com concha, no chão em frente ao banco.
  b.rect(5, 3, 5, 4, N.plank.base);
  b.vline(5, 3, 6, N.plank.lt);
  b.hline(5, 9, 4, N.iron.base);
  b.hline(5, 9, 2, WATER.base);
  b.set(6, 2, WATER.lt);
  b.line(8, 2, 10, -1, N.wood.lt);
  // Divisórias laterais (topo visto de cima, de y=-22 até a frente).
  for (const x of [0, 29]) {
    b.rect(x, -22, 3, 34, wall.base);
    b.vline(x, -22, 11, wall.lt);
    b.vline(x + 2, -22, 11, wall.dk);
    b.hline(x, x + 2, -22, wall.hi);
    for (const y of [-12, 0]) b.hline(x, x + 2, y, N.iron.base);
  }
  b.outline();
  underRect(b, 2, 0, 28, 12, 'rgba(30,34,52,0.14)');
  // Frente: parede de tábuas com a viga em cima e a porta (cobre o interior).
  const front = floorSheet(2, 2, 26, 3, 4);
  const f = front.buf;
  f.rect(0, 10, 32, 20, wall.base);
  planks(f, 0, 11, 32, 18, wall, 7, 5);
  f.rect(-1, 8, 34, 3, N.wood.base);
  f.hline(-1, 32, 8, N.wood.hi);
  f.hline(-1, 32, 10, N.wood.dk);
  f.vline(0, 11, 29, wall.lt);
  f.vline(31, 11, 29, wall.dk);
  f.hline(0, 31, 29, wall.dd);
  // Postes no vão de baixo.
  for (const x of [0, 30]) f.rect(x, 30, 2, 2, N.woodDark.base);
  const door = (x0: number, x1: number) => {
    f.rect(x0, 12, x1 - x0 + 1, 17, N.plank.lt);
    for (let x = x0 + 3; x < x1; x += 4) f.vline(x, 12, 28, N.plank.base);
    f.vline(x0, 12, 28, N.plank.dk);
    f.vline(x1, 12, 28, N.plank.dd);
    f.hline(x0, x1, 12, N.plank.hi);
    // Travessas em Z e dobradiças de ferro.
    for (const y of [14, 25]) {
      f.hline(x0 + 1, x1 - 1, y, N.wood.base);
      f.hline(x0 + 1, x1 - 1, y + 1, N.wood.dk);
    }
    f.line(x0 + 2, 24, x1 - 2, 16, N.wood.base);
    hinge(f, x0, 14, 5);
    hinge(f, x0, 25, 5);
  };
  if (occupied) {
    door(7, 24);
    // Respiro em forma de runa, argola e a runa acesa (vermelha).
    rune(f, 14, 17, 3, '#2a1e16');
    f.set(21, 20, N.iron.hi);
    f.set(20, 21, N.iron.lt);
    f.set(22, 21, N.iron.dk);
    f.set(21, 22, N.iron.dd);
  } else {
    // Porta entreaberta: vão escuro à direita e a folha mais estreita em perspectiva.
    f.rect(19, 12, 6, 17, '#2a2420');
    f.rect(20, 13, 4, 15, '#3d342c');
    door(7, 18);
    rune(f, 11, 17, 3, '#2a1e16');
  }
  f.outline();
  // Runa-sinal acesa (depois do contorno): verde livre, vermelha ocupada.
  const sign = occupied ? '#e05a5a' : '#5fd07a';
  f.rect(26, 14, 2, 2, sign);
  f.set(26, 14, occupied ? '#ff9a8a' : '#a8f0b8');
  f.set(26, 13, occupied ? 'rgba(224,90,90,0.35)' : 'rgba(95,208,122,0.35)');
  f.set(28, 15, occupied ? 'rgba(224,90,90,0.35)' : 'rgba(95,208,122,0.35)');
  return { base: s, front };
}

/** Bacia de pedra sobre um móvel entalhado, com jarro de bronze e toalha de linho. */
export function sink(): BufFurniture {
  const s = floorSheet(1, 1, 10);
  const b = s.buf;
  const w = N.wood;
  const st = N.stone;
  frontFace(b, 1, 4, 14, 12, w);
  b.vline(1, 4, 15, w.lt);
  recess(b, 3, 6, 10, 7, w);
  b.rect(2, 14, 12, 2, N.woodDark.dk);
  // Toalha de linho pendurada num pino.
  b.set(10, 6, N.iron.hi);
  b.rect(9, 7, 4, 6, '#e8e2d0');
  b.vline(12, 7, 12, '#c9c0aa');
  b.hline(9, 12, 10, '#a8323a');
  b.hline(9, 12, 12, '#d8d0bc');
  // Tampo de tábuas.
  topFace(b, 0, -3, 16, 7, N.plank);
  b.hline(0, 15, 4, N.plank.dk);
  b.vline(5, -2, 2, N.plank.base);
  b.vline(11, -2, 2, N.plank.base);
  // Bacia redonda de pedra com água (bojo, borda e espelho d'água).
  b.ellipse(7.5, 1.6, 6.2, 3, st.dk);
  b.ellipse(7.5, 0.5, 6.2, 2.7, st.base);
  b.ellipse(7.5, 0.1, 5.8, 2.3, st.lt);
  b.hline(3, 11, -2, st.hi);
  b.ellipse(7.5, 0.4, 4.4, 1.5, WATER.base);
  b.hline(5, 8, 0, WATER.lt);
  b.set(9, 1, WATER.hi);
  // Jarro de bronze atrás, à direita.
  const z = N.bronze;
  b.rect(12, -6, 3, 4, z.base);
  b.vline(12, -6, -3, z.lt);
  b.set(12, -7, z.hi);
  b.set(13, -7, z.base);
  b.set(11, -7, z.dk);
  b.vline(15, -6, -4, z.dk);
  b.set(14, -3, z.dk);
  b.outline();
  contact(b, 0, 14, 16, 3, 0.2);
  return { base: s };
}

/** Espelho de bronze polido com moldura entalhada de topo arredondado. rects.glass = área refletora. */
export function mirror(): BufFurniture {
  const s = wallSheet(1);
  const b = s.buf;
  const x = 2;
  const y = -28;
  const w = 12;
  const h = 14;
  const fr = N.wood;
  b.rect(x, y, w, h, fr.base);
  b.hline(x, x + w - 1, y, fr.hi);
  b.vline(x, y, y + h - 1, fr.lt);
  b.vline(x + w - 1, y, y + h - 1, fr.dk);
  b.hline(x, x + w - 1, y + h - 1, fr.dk);
  b.clear(x, y);
  b.clear(x + w - 1, y);
  // Bronze: mais claro no alto/esquerda, mais escuro embaixo/direita, com reflexos diagonais.
  const gx = x + 1;
  const gy = y + 1;
  const gw = w - 2;
  const gh = h - 2;
  for (let yy = 0; yy < gh; yy++) {
    for (let xx = 0; xx < gw; xx++) {
      const t = (xx / gw + yy / gh) / 2;
      b.set(gx + xx, gy + yy, t < 0.3 ? '#e2b97c' : t < 0.55 ? '#c99a5c' : t < 0.8 ? '#ad7c44' : '#8e6234');
    }
  }
  b.line(gx + 6, gy, gx + 1, gy + gh - 3, 'rgba(255,244,214,0.6)');
  b.line(gx + 8, gy, gx + 3, gy + gh - 2, 'rgba(255,244,214,0.3)');
  // Cantos de cima arredondados pela moldura e o remate dourado.
  b.set(gx, gy, fr.base);
  b.set(gx + gw - 1, gy, fr.base);
  stud(b, x + w / 2 - 1, y + h - 1);
  b.set(x + w / 2, y, N.gold.hi);
  b.outline();
  wallShadow(b, x - 1, y - 1, w + 2, h + 2);
  // Vidro (sem a moldura): o mundo pode desenhar ali o reflexo de quem está diante da bacia.
  s.rects = { glass: rectAt(s, gx, gy, gw, gh) };
  return { base: s };
}
