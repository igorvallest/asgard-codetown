// Mesas e assentos de trabalho de Asgard: a mesa do pergaminho mágico (frente e verso), as cadeiras entalhadas, a
// mesa de banquete e o toco. Coordenadas de desenho = footprint, como em furniture/office.ts (mesmas folhas, âncoras
// e retângulos: o mundo posiciona e anima pelo tipo).
import { ramp, shade, type Ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, type BufFurniture, type BufSprite } from '../core/sprite';
import { contact, frontFace, pick, rngOf, topFace, underRect } from '../furniture/kit';
import {
  FOGO, N, SOMBRA, acende, caneca, chamaVela, chifre, corvo, elmo, folhaFixa, folhas, friso, halo, linhaRunica, moedas,
  pelego, pergaminhoEmPe, pergaminhoVerso, pomo, rebite, seixo, tabuaRunas, tabuas, tinteiro, vela, type Box, type Luzes,
} from './trabalho-kit';

// ------------------------------------------------------------------ mesa do pergaminho

interface MesaMats {
  tampo: Ramp;
  borda: Ramp;
  pernas: Ramp;
}

/** 'wood' = pinho com pernas de carvalho; 'white' = freixo claro (bétula); 'dark' = carvalho enegrecido. */
function mesaMats(variant: string | undefined): MesaMats {
  switch (variant) {
    case 'white':
      return { tampo: ramp('#cfb68d', 0.05), borda: ramp('#a88e69', 0.055), pernas: ramp('#a2845e', 0.06) };
    case 'dark':
      return { tampo: ramp('#4d3329', 0.06), borda: ramp('#37251e', 0.06), pernas: ramp('#3f2b22', 0.06) };
    default:
      return { tampo: N.pinho, borda: ramp('#74502f', 0.065), pernas: N.carvalho };
  }
}

/** Sombra de contato da mesa e do vão sob o tampo (por baixo, depois do contorno). */
function sombraMesa(b: PixelBuf): void {
  underRect(b, 3, 9, 26, 6, 'rgba(24,14,10,0.24)');
  contact(b, -1, 13, 34, 4, 0.24);
}

/** Tampo de tábuas com borda entalhada, pernas torneadas e (na frente) gaveteiro com argolas de ferro. */
function mesaCorpo(s: BufSprite, m: MesaMats, seed: number, back: boolean): void {
  const b = s.buf;
  const p = m.pernas;
  if (back) {
    // Painel entalhado fechando o vão (é o lado que a câmera vê).
    b.rect(2, 9, 28, 6, p.base);
    b.hline(2, 29, 9, p.dd);
    friso(b, 5, 10, 22, p);
    b.hline(2, 29, 13, p.lt);
    b.hline(2, 29, 14, p.dk);
    for (const x of [3, 28]) b.set(x, 11, N.ouro.lt);
  }
  for (const x of [0, 28]) {
    b.rect(x, 9, 4, 7, p.base);
    b.vline(x, 9, 15, p.lt);
    b.vline(x + 3, 9, 15, p.dk);
    b.hline(x, x + 3, 11, p.hi);
    b.hline(x, x + 3, 12, p.dd);
    b.hline(x, x + 3, 15, p.dd);
  }
  if (!back) {
    // Travessa baixa entre as pernas e gaveteiro sob o lado direito.
    b.hline(4, 18, 13, p.dk);
    b.hline(4, 18, 14, p.dd);
    frontFace(b, 19, 9, 9, 7, p);
    b.hline(19, 27, 9, p.dd);
    b.hline(19, 27, 12, p.dd);
    b.hline(19, 27, 13, p.lt);
    for (const y of [10, 14]) {
      b.set(22, y, N.ferro.lt);
      b.set(24, y, N.ferro.lt);
      b.set(23, y + 1, N.ferro.base);
    }
  }
  topFace(b, 0, -6, 32, 12, m.tampo);
  tabuas(b, 0, -6, 32, 12, m.tampo, seed);
  friso(b, 0, 6, 32, m.borda);
  // Cantoneiras de ferro na borda.
  for (const x of [0, 30]) {
    b.rect(x, 6, 2, 3, N.ferro.base);
    b.hline(x, x + 1, 6, N.ferro.lt);
    rebite(b, x === 0 ? 0 : 31, 7);
  }
}

/** Grimório aberto: capa de couro, página da esquerda escrita e a da direita acesa (devolvida como 2ª "tela"). */
function grimorio(b: PixelBuf, x: number, y: number, seed: number): Box {
  const c = N.couro;
  const p = N.pergaminho;
  b.hline(x + 1, x + 15, y + 6, SOMBRA);
  b.rect(x, y + 1, 15, 5, c.base);
  b.hline(x, x + 14, y + 5, c.dk);
  b.set(x, y + 5, N.ouro.base);
  b.set(x + 14, y + 5, N.ouro.base);
  // Páginas: cantos de fora mais baixos (a folha curva), dobra escura no meio e o maço visto na base.
  b.rect(x + 2, y, 5, 5, p.lt);
  b.rect(x + 1, y + 1, 1, 4, p.base);
  b.rect(x + 8, y, 5, 5, p.lt);
  b.rect(x + 13, y + 1, 1, 4, p.base);
  b.vline(x + 7, y + 1, y + 4, c.dd);
  b.vline(x + 6, y, y + 4, p.dk);
  b.hline(x + 1, x + 13, y + 4, p.dk);
  for (let i = 1; i < 4; i++) linhaRunica(b, x + 2, y + i, 4, '#7d5a3c', seed + i);
  const page = { x: x + 8, y, w: 5, h: 4 };
  folhaFixa(b, page, 'texto', seed);
  return page;
}

/** Objetos da mesa por variação (0..5). Devolve a folha principal e, quando há, a secundária. */
function mesaTopo(s: BufSprite, seed: number, luz: Luzes): { screen: Box; screen2?: Box } {
  const b = s.buf;
  const v = seed % 6;
  let screen: Box;
  let screen2: Box | undefined;
  switch (v) {
    case 1: {
      // Dois pergaminhos: o secundário traz uma tabela de runas.
      screen = pergaminhoEmPe(b, 2, -17, 15, 11, luz, seed);
      screen2 = pergaminhoEmPe(b, 20, -15, 10, 9, luz, seed + 1);
      folhaFixa(b, screen2, 'tabela', seed);
      tabuaRunas(b, 5, -1, 11);
      seixo(b, 18, 0);
      caneca(b, 25, -3);
      break;
    }
    case 2: {
      // Pergaminho e grimório aberto com a página acesa.
      screen = pergaminhoEmPe(b, 5, -17, 15, 11, luz, seed);
      screen2 = grimorio(b, 17, -4, seed);
      tabuaRunas(b, 7, -1, 10);
      vela(b, 1, -3, luz);
      break;
    }
    case 3: {
      screen = pergaminhoEmPe(b, 8, -17, 16, 11, luz, seed);
      corvo(b, 1, -6);
      tabuaRunas(b, 11, -1, 10);
      seixo(b, 23, 0);
      folhas(b, 24, -4, 6, 4, seed);
      caneca(b, 4, 0);
      break;
    }
    case 4: {
      // Dois pergaminhos: o secundário é o mapa dos nove reinos.
      screen = pergaminhoEmPe(b, 3, -17, 15, 11, luz, seed);
      screen2 = pergaminhoEmPe(b, 21, -16, 9, 10, luz, seed + 2);
      folhaFixa(b, screen2, 'mapa', seed);
      tabuaRunas(b, 6, -1, 11);
      seixo(b, 20, 0);
      folhas(b, 26, -1, 5, 4, seed);
      break;
    }
    case 5: {
      screen = pergaminhoEmPe(b, 8, -17, 16, 11, luz, seed);
      elmo(b, 0, -4);
      tabuaRunas(b, 11, -1, 10);
      seixo(b, 23, 0);
      tinteiro(b, 26, -1);
      chifre(b, 22, -5, 8, true);
      break;
    }
    default: {
      screen = pergaminhoEmPe(b, 8, -17, 16, 11, luz, seed);
      tabuaRunas(b, 11, -1, 10);
      seixo(b, 23, 0);
      caneca(b, 2, -3);
      folhas(b, 25, -4, 6, 4, seed);
      moedas(b, 27, 1);
      break;
    }
  }
  return { screen, screen2 };
}

export function mesa(variant: string | undefined, seed: number): BufFurniture {
  const s = floorSheet(2, 1, 22);
  const luz: Luzes = [];
  mesaCorpo(s, mesaMats(variant), seed, false);
  const scr = mesaTopo(s, seed, luz);
  s.buf.outline();
  acende(luz);
  sombraMesa(s.buf);
  s.rects = { screen: rectAt(s, scr.screen.x, scr.screen.y, scr.screen.w, scr.screen.h) };
  if (scr.screen2) s.rects.screen2 = rectAt(s, scr.screen2.x, scr.screen2.y, scr.screen2.w, scr.screen2.h);
  return { base: s };
}

export function mesaVerso(variant: string | undefined, seed: number): BufFurniture {
  const s = floorSheet(2, 1, 14);
  const b = s.buf;
  const luz: Luzes = [];
  mesaCorpo(s, mesaMats(variant), seed, true);
  const v = seed % 4;
  if (v === 1) {
    pergaminhoVerso(b, 2, -7, 15, 10, seed);
    pergaminhoVerso(b, 20, -6, 10, 9, seed + 1);
  } else {
    pergaminhoVerso(b, 8, -7, 16, 10, seed);
    if (v === 2) vela(b, 27, -1, luz);
    else folhas(b, 25, -1, 6, 4, seed);
    if (v === 3) corvo(b, 1, -4);
    else caneca(b, 2, -1);
  }
  b.outline();
  acende(luz);
  sombraMesa(b);
  return { base: s };
}

// ------------------------------------------------------------------ cadeiras

/** Estofado por variante: couro/lã tingidos; 'gray' e 'black' são pelegos (lobo e urso). */
const ESTOFADOS: Readonly<Record<string, string>> = {
  black: '#4a3f3a',
  blue: '#3d5d8c',
  red: '#9a3a2e',
  green: '#4a6b3b',
  gray: '#9d968b',
};

function estofado(variant: string | undefined): { m: Ramp; pelo: boolean } {
  const v = variant && ESTOFADOS[variant] ? variant : 'black';
  return { m: ramp(ESTOFADOS[v], 0.07), pelo: v === 'gray' || v === 'black' };
}

/** Almofada do assento: pelego com franja ou tecido com pesponto claro. */
function almofada(b: PixelBuf, x: number, y: number, w: number, h: number, e: { m: Ramp; pelo: boolean }, seed: number): void {
  if (e.pelo) {
    pelego(b, x, y, w, h, e.m, seed);
    return;
  }
  b.rect(x, y, w, h, e.m.base);
  b.hline(x, x + w - 1, y, e.m.lt);
  b.hline(x + 1, x + w - 2, y + 1, e.m.hi);
  b.hline(x, x + w - 1, y + h - 1, e.m.dk);
  for (let xx = x + 1; xx < x + w - 1; xx += 2) b.set(xx, y + h - 2, shade(e.m.base, 0.12));
}

/** Cadeira vista por trás (quem senta olha para cima): base com assento e pernas; `front` = encosto baixo. */
export function cadeira(variant: string | undefined): BufFurniture {
  const e = estofado(variant);
  const w = N.carvalho;
  const base = floorSheet(1, 1, 6);
  const b = base.buf;
  // Pernas traseiras (aparecem entre as da frente), travessa e pernas da frente.
  for (const x of [4, 10]) b.rect(x, 9, 2, 5, w.dk);
  b.hline(3, 12, 12, w.dk);
  for (const x of [2, 12]) {
    b.rect(x, 9, 2, 7, w.base);
    b.vline(x, 9, 15, w.lt);
    b.set(x + 1, 15, w.dd);
  }
  // Assento: aro de madeira e almofada.
  b.rect(2, 4, 12, 6, w.base);
  b.hline(2, 13, 4, w.lt);
  almofada(b, 3, 4, 10, 4, e, 3);
  b.hline(2, 13, 8, w.base);
  b.hline(2, 13, 9, w.dk);
  b.set(2, 8, w.lt);
  b.outline();
  contact(b, 1, 13, 14, 3, 0.24);
  // Encosto baixo e estreito (cobre a lombar e deixa ombros e braços à mostra), com pomos nos postes.
  const front = floorSheet(1, 1, 6);
  const f = front.buf;
  for (const x of [4, 11]) {
    f.rect(x, 6, 1, 8, w.base);
    f.set(x, 6, w.lt);
    f.set(x, 13, w.dk);
  }
  f.rect(5, 7, 6, 5, e.m.base);
  f.hline(5, 10, 7, e.m.lt);
  f.hline(5, 10, 11, e.m.dk);
  if (e.pelo) for (const x of [5, 7, 9]) f.set(x, 9, e.m.dk);
  else f.set(7, 9, N.ouro.lt);
  f.hline(4, 11, 6, w.lt);
  f.hline(4, 11, 12, w.dk);
  pomo(f, 3, 4);
  pomo(f, 11, 4);
  f.rect(7, 13, 2, 1, w.dd);
  f.outline();
  return { base, front };
}

/** Cadeira de espaldar alto vista de frente (par da desk_back): encosto entalhado ao norte, sem `front`. */
export function cadeiraFrente(variant: string | undefined): BufFurniture {
  const e = estofado(variant);
  const w = N.carvalho;
  const s = floorSheet(1, 1, 12);
  const b = s.buf;
  // Pernas e travessa.
  for (const x of [2, 12]) {
    b.rect(x, 10, 2, 6, w.base);
    b.vline(x, 10, 15, w.lt);
    b.set(x + 1, 15, w.dd);
  }
  b.hline(4, 11, 13, w.dk);
  // Espaldar: postes com pomos, crista entalhada e painel estofado.
  for (const x of [2, 12]) {
    b.rect(x, -8, 2, 13, w.base);
    b.vline(x, -8, 4, w.lt);
    b.vline(x + 1, -8, 4, w.dk);
  }
  b.rect(4, -8, 8, 3, w.base);
  b.hline(4, 11, -8, w.lt);
  b.hline(4, 11, -6, w.dk);
  b.set(7, -7, N.ouro.hi);
  b.set(8, -7, N.ouro.base);
  almofada(b, 4, -5, 8, 9, e, 5);
  if (!e.pelo) for (const [x, y] of [[4, -5], [11, -5], [4, 3], [11, 3]] as const) b.set(x, y, N.ouro.lt);
  pomo(b, 2, -10);
  pomo(b, 12, -10);
  // Assento.
  b.rect(2, 5, 12, 5, w.base);
  b.hline(2, 13, 5, w.lt);
  almofada(b, 3, 5, 10, 3, e, 7);
  b.hline(2, 13, 8, w.base);
  b.hline(2, 13, 9, w.dk);
  b.outline();
  contact(b, 1, 13, 14, 3, 0.24);
  return { base: s };
}

// ------------------------------------------------------------------ mesa de banquete

/** Prato de carvalho com comida (lugar de cada um à mesa). */
function prato(b: PixelBuf, x: number, y: number, r: () => number): void {
  b.ellipse(x + 3, y + 1.5, 3.5, 1.8, N.carvalho.dd);
  b.ellipse(x + 3, y + 1.3, 2.8, 1.3, N.carvalho.lt);
  const food = pick(r, ['#a8642e', '#c98a3e', '#7a9a4a']);
  b.rect(x + 2, y + 1, 2, 1, food);
  b.set(x + 4, y + 1, shade(food, 0.15));
}

/** Assado (javali) numa travessa, com osso aparente e ervas. */
function assado(b: PixelBuf, cx: number, cy: number): void {
  b.ellipse(cx, cy + 0.5, 7.5, 3.2, N.pinho.dk);
  b.ellipse(cx, cy + 0.2, 6.6, 2.5, N.pinho.lt);
  const c = ramp('#9a5226', 0.08);
  b.ellipse(cx, cy - 0.5, 4.5, 2.2, c.dk);
  b.ellipse(cx - 0.3, cy - 0.9, 4, 1.7, c.base);
  b.hline(cx - 3, cx, cy - 2, c.lt);
  b.set(cx - 2, cy - 2, c.hi);
  b.hline(cx + 4, cx + 6, cy - 2, '#f2ead6');
  b.set(cx + 6, cy - 3, '#f2ead6');
  b.set(cx - 5, cy + 1, '#5c8a3a');
  b.set(cx + 5, cy + 1, '#4f7a32');
}

/** Pão redondo. */
function pao(b: PixelBuf, x: number, y: number): void {
  b.ellipse(x + 2, y + 1.2, 2.5, 1.5, '#b07432');
  b.hline(x + 1, x + 2, y, '#d9a056');
  b.set(x + 2, y + 1, '#8a5424');
}

/** Tigela com maçãs douradas (as de Idun). */
function macas(b: PixelBuf, x: number, y: number): void {
  b.ellipse(x + 3, y + 2.5, 3.6, 1.8, N.carvalho.base);
  b.hline(x, x + 6, y + 2, N.carvalho.lt);
  for (const [dx, dy] of [[1, 0], [3, -1], [5, 0], [2, 1], [4, 1]] as const) {
    b.set(x + dx, y + dy, N.ouro.base);
    b.set(x + dx, y + dy - 1, N.ouro.hi);
  }
  b.set(x + 3, y - 3, '#4f7a32');
}

/** Queijo em roda com uma fatia cortada. */
function queijo(b: PixelBuf, x: number, y: number): void {
  b.ellipse(x + 2.5, y + 1.5, 2.8, 1.7, '#e8c25a');
  b.hline(x, x + 4, y + 3, '#c79a36');
  b.set(x + 3, y + 1, '#c79a36');
  b.set(x + 4, y + 1, '#fff0b0');
}

/** Castiçal de ferro com três velas (chamas em `luz`). */
function castical(b: PixelBuf, x: number, y: number, luz: Luzes): void {
  const f = N.ferro;
  b.hline(x + 1, x + 8, y + 5, SOMBRA);
  b.hline(x, x + 6, y + 3, f.base);
  b.rect(x + 2, y + 4, 3, 1, f.dk);
  for (const dx of [0, 3, 6]) {
    b.vline(x + dx, y, y + 2, '#efe3c2');
    b.set(x + dx, y - 1, '#3a2a20');
  }
  b.vline(x + 3, y - 2, y + 2, '#efe3c2');
  b.set(x + 3, y - 3, '#3a2a20');
  luz.push(() => {
    for (const dx of [0, 6]) {
      b.set(x + dx, y - 2, FOGO.hi);
      b.set(x + dx, y - 3, FOGO.dk);
    }
    chamaVela(b, x + 2, y - 7);
    halo(b, x + 3.5, y - 3, 6, 4, FOGO.hi, 0.16);
  });
}

export function mesaBanquete(seed: number): BufFurniture {
  const s = floorSheet(3, 2, 12);
  const b = s.buf;
  const t = N.pinho;
  const p = N.carvalho;
  const r = rngOf(seed, 31);
  const luz: Luzes = [];
  // Cavaletes nas pontas, com sapata larga.
  for (const x of [2, 42]) {
    b.rect(x, 23, 4, 9, p.base);
    b.vline(x, 23, 31, p.lt);
    b.vline(x + 3, 23, 31, p.dk);
    b.rect(x - 1, 30, 6, 2, p.dk);
    b.hline(x - 1, x + 4, 30, p.base);
  }
  b.hline(6, 41, 28, p.dk);
  topFace(b, 0, -4, 48, 24, t);
  tabuas(b, 0, -4, 48, 24, t, seed, 6);
  friso(b, 0, 20, 48, p);
  // Caminho de mesa de lã tingida, com barras de ouro e losangos tecidos.
  const pano = ramp(seed % 2 ? '#2f4f6e' : '#7a2a2a', 0.07);
  b.rect(4, 3, 40, 9, pano.base);
  b.hline(4, 43, 3, pano.lt);
  b.hline(4, 43, 4, N.ouro.dk);
  b.hline(4, 43, 10, N.ouro.dk);
  b.hline(4, 43, 11, pano.dk);
  for (let x = 6; x < 43; x += 6) {
    b.set(x, 6, pano.hi);
    b.set(x - 1, 7, pano.hi);
    b.set(x + 1, 7, pano.hi);
    b.set(x, 8, pano.hi);
  }
  for (const x of [0, 46]) {
    b.rect(x, 20, 2, 3, N.ferro.base);
    b.hline(x, x + 1, 20, N.ferro.lt);
  }
  // Lugares: prato e caneca para quem senta ao norte e ao sul.
  for (const x of [5, 37]) {
    prato(b, x, -2, r);
    prato(b, x, 15, r);
  }
  caneca(b, 12, -3);
  caneca(b, 31, 13);
  chifre(b, 30, -4, 7, true);
  chifre(b, 12, 13, 7);
  if (seed % 2 === 0) {
    castical(b, 20, 0, luz);
    assado(b, 24, 9);
    macas(b, 35, 6);
    pao(b, 10, 7);
    queijo(b, 14, 3);
  } else {
    // Peixes defumados, jarra de hidromel e moedas da aposta.
    b.ellipse(23, 9.5, 8, 3, N.pinho.dk);
    b.ellipse(23, 9.2, 7, 2.3, N.pinho.lt);
    for (const dy of [-1, 1]) {
      b.hline(18, 26, 9 + dy, '#9fb0b8');
      b.set(27, 9 + dy, '#7f909a');
      b.set(28, 8 + dy, '#7f909a');
      b.set(28, 10 + dy, '#7f909a');
      b.set(19, 9 + dy, '#2a2a36');
    }
    const j = ramp('#a86a44', 0.07);
    b.rect(34, 2, 5, 6, j.base);
    b.vline(34, 2, 7, j.lt);
    b.vline(38, 2, 7, j.dk);
    b.hline(35, 37, 1, j.dk);
    b.set(39, 3, j.dk);
    b.set(39, 4, j.dk);
    b.hline(34, 38, 4, '#e8d7b0');
    pao(b, 9, 7);
    pao(b, 13, 9);
    moedas(b, 30, 10);
    macas(b, 16, 2);
    castical(b, 40, 4, luz);
  }
  b.outline();
  acende(luz);
  contact(b, -1, 28, 50, 5, 0.24);
  underRect(b, 6, 23, 36, 7, 'rgba(24,14,10,0.2)');
  return { base: s };
}

// ------------------------------------------------------------------ toco

export function toco(): BufFurniture {
  const s = floorSheet(1, 1, 3);
  const b = s.buf;
  const bark = ramp('#6a4a33', 0.07);
  const wood = ramp('#c9a272', 0.06);
  // Raízes saindo na base.
  for (const [x0, x1] of [[3, 1], [12, 14], [6, 5], [10, 11]] as const) b.line(x0, 12, x1, 15, bark.dk, 2);
  // Tronco: cilindro de casca com sulcos verticais.
  b.rect(3, 5, 10, 9, bark.base);
  b.ellipse(8, 13.5, 5, 1.6, bark.base);
  b.vline(3, 5, 13, bark.lt);
  b.vline(4, 5, 13, bark.lt);
  b.vline(12, 5, 13, bark.dk);
  for (const [x, y0, y1] of [[6, 7, 12], [9, 6, 10], [11, 8, 13], [5, 10, 13]] as const) b.vline(x, y0, y1, bark.dd);
  // Musgo e um cogumelo.
  b.set(4, 11, '#5f8a3a');
  b.set(5, 12, '#5f8a3a');
  b.set(3, 12, '#4f7a32');
  b.set(13, 11, '#d8c8a8');
  b.set(14, 10, '#b8402f');
  b.set(13, 10, '#b8402f');
  // Tampo: anéis de crescimento.
  b.ellipse(8, 5.2, 5.5, 2.8, bark.dk);
  b.ellipse(8, 4.8, 4.9, 2.3, wood.lt);
  b.ellipse(8, 4.8, 3.4, 1.5, wood.base);
  b.ellipse(8, 4.8, 2.4, 1, wood.lt);
  b.set(8, 4, wood.dk);
  b.line(6, 3, 9, 6, wood.dk);
  b.set(5, 3, wood.hi);
  b.outline();
  contact(b, 2, 13, 12, 3, 0.26);
  return { base: s };
}
