// Asgard, cozinha: bancadas de madeira escura com tampo de pedra, caldeirão no fogo, forno de barro, baú de gelo,
// prateleira de provisões, barril de hidromel e as mesinhas do refeitório. Mesmas pegadas e alturas de uso da
// copa do Escritório (furniture/common.ts): coordenadas de desenho = footprint, base em y = h*TILE.
import { ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, rectAt, type BufFurniture } from '../core/sprite';
import { contact, frontFace, topFace } from '../furniture/kit';
import { N, WATER, candle, candleFlame, fire, halo, recess, ring, rune, seamless, strap, stud } from './saloes-kit';

const CAB = ramp('#6a4831', 0.065);
const TOP = ramp('#9ba4ae', 0.045);

type CabinetKind = 'plain' | 'drawers' | 'doors' | 'logs';

/** Bancada encostada na parede norte: gabinete de madeira escura e tampo grosso de pedra. */
function counterBase(b: PixelBuf, kind: CabinetKind): void {
  // Gabinete com sombra do tampo e rodapé fundo.
  frontFace(b, 0, 5, 16, 11, CAB);
  b.vline(0, 5, 15, CAB.lt);
  b.vline(15, 5, 13, CAB.dd);
  b.hline(0, 15, 5, CAB.dd);
  b.rect(1, 14, 14, 2, N.woodDark.dk);
  b.hline(1, 14, 14, N.woodDark.dd);
  if (kind === 'drawers') {
    recess(b, 2, 6, 12, 4, CAB);
    recess(b, 2, 10, 12, 4, CAB);
    for (const y of [7, 11]) {
      b.hline(7, 8, y, N.iron.hi);
      b.hline(7, 8, y + 1, N.iron.dk);
    }
  } else if (kind === 'doors') {
    recess(b, 1, 6, 6, 8, CAB);
    recess(b, 9, 6, 6, 8, CAB);
    ring(b, 4, 8);
    ring(b, 9, 8);
  } else if (kind === 'logs') {
    // Nicho aberto com lenha empilhada: pontas redondas das toras, casca escura e anéis.
    b.rect(2, 6, 12, 8, N.woodDark.dd);
    const log = (x: number, y: number) => {
      b.rect(x, y, 4, 4, '#6e4a30');
      b.rect(x + 1, y, 2, 4, '#d2a46a');
      b.rect(x, y + 1, 4, 2, '#d2a46a');
      b.set(x + 1, y + 1, '#e8c48a');
      b.set(x + 2, y + 2, '#a8784a');
      b.clear(x, y);
      b.clear(x + 3, y);
      b.clear(x, y + 3);
      b.clear(x + 3, y + 3);
      b.set(x, y, N.woodDark.dd);
      b.set(x + 3, y, N.woodDark.dd);
      b.set(x, y + 3, N.woodDark.dd);
      b.set(x + 3, y + 3, N.woodDark.dd);
    };
    for (const x of [2, 6, 10]) log(x, 10);
    for (const x of [4, 8]) log(x, 6);
  } else {
    recess(b, 2, 6, 12, 8, CAB);
    // Dobradiças de ferro em cinta (ponta em lança) e argola.
    for (const y of [7, 11]) {
      b.hline(1, 5, y, N.iron.lt);
      b.set(6, y, N.iron.base);
      b.set(2, y, N.iron.hi);
    }
    ring(b, 10, 8);
  }
  // Tampo de pedra (laje grossa) com aresta clara e frente em dois tons.
  topFace(b, 0, -3, 16, 6, TOP);
  b.hline(0, 15, 3, TOP.base);
  b.hline(0, 15, 4, TOP.dk);
  for (const [x, y] of [[3, -1], [11, 1], [7, 0], [13, -2]] as const) b.set(x, y, TOP.base);
  b.set(5, 4, TOP.dd);
  b.set(12, 3, TOP.dk);
}

export function counter(variant: string | undefined): BufFurniture {
  const s = floorSheet(1, 1, 6);
  counterBase(s.buf, variant === 'drawers' ? 'drawers' : 'plain');
  s.buf.outline();
  seamless(s.buf);
  contact(s.buf, 0, 14, 16, 3, 0.2);
  return { base: s };
}

export function counterSink(): BufFurniture {
  const s = floorSheet(1, 1, 14);
  const b = s.buf;
  counterBase(b, 'doors');
  // Cuba escavada na pedra, com água.
  b.rect(3, -2, 10, 5, TOP.dd);
  b.hline(3, 12, -2, TOP.dk);
  b.rect(4, 0, 8, 3, WATER.base);
  b.hline(4, 11, 0, WATER.dk);
  b.hline(5, 9, 1, WATER.lt);
  b.set(10, 2, WATER.hi);
  b.hline(3, 12, 3, TOP.hi);
  // Bomba d'água de ferro atrás da cuba: corpo com tampa, bica curva e a alavanca com a manopla.
  const fe = N.iron;
  b.rect(6, -8, 3, 7, fe.base);
  b.vline(6, -8, -2, fe.lt);
  b.vline(8, -8, -2, fe.dk);
  b.hline(5, 9, -9, fe.lt);
  b.hline(6, 8, -10, fe.hi);
  b.hline(5, 9, -2, fe.dk);
  b.hline(9, 10, -6, fe.base);
  b.set(9, -7, fe.lt);
  b.set(11, -5, fe.dk);
  b.set(10, -5, fe.base);
  b.line(5, -9, 2, -11, fe.dk);
  b.rect(1, -12, 2, 2, N.wood.lt);
  b.outline();
  seamless(b);
  // Fio d'água caindo da bica (depois do contorno).
  b.vline(11, -4, -2, 'rgba(160,210,235,0.7)');
  b.set(11, -1, 'rgba(220,240,250,0.8)');
  contact(b, 0, 14, 16, 3, 0.2);
  return { base: s };
}

/** Caldeirão de ferro num fogareiro de pedras sobre a bancada. state 1 = fervendo (fogo alto e vapor). */
export function coffeeMachine(state: number): BufFurniture {
  const s = floorSheet(1, 1, 18);
  const b = s.buf;
  counterBase(b, 'logs');
  const on = state >= 1;
  const fe = N.iron;
  // Pedras do fogareiro, atrás e dos lados.
  for (const [x, y] of [[1, -1], [13, -1], [4, -2], [10, -2]] as const) {
    b.rect(x, y, 2, 2, TOP.dk);
    b.set(x, y, TOP.lt);
  }
  // Pés e bojo do caldeirão (esfera de ferro, luz de cima/esquerda).
  b.set(4, 0, fe.dd);
  b.set(11, 0, fe.dd);
  b.ellipse(8, -5, 5.5, 4.6, fe.dk);
  b.ellipse(7.4, -5.6, 4.7, 3.8, fe.base);
  b.ellipse(6.4, -6.6, 2.3, 1.7, fe.lt);
  b.set(5, -7, fe.hi);
  b.hline(4, 12, -1, fe.dd);
  // Boca: aro e o caldo (escuro parado; dourado e borbulhando fervendo).
  b.ellipse(8, -9.5, 5, 1.7, fe.lt);
  b.hline(4, 11, -11, fe.hi);
  const broth = on ? '#c98a38' : '#5a3d26';
  b.hline(5, 10, -10, broth);
  b.hline(6, 9, -9, on ? '#a86e2c' : '#4a3220');
  b.outline();
  seamless(b);
  contact(b, 0, 14, 16, 3, 0.2);
  // Alça em arco (fio fino, sem contorno).
  b.line(3, -11, 4, -13, fe.dk);
  b.line(4, -13, 6, -15, fe.dk);
  b.hline(6, 9, -15, fe.dk);
  b.line(10, -15, 12, -13, fe.dk);
  b.line(12, -13, 13, -11, fe.dk);
  b.set(6, -15, fe.lt);
  // Fogo (ou brasas) lambendo o fundo, e bolhas/vapor quando ferve.
  fire(b, 3, 12, 1, on ? 0.9 : 0, 5);
  if (on) {
    halo(b, 8, -1, 7, '#ff9a3c', 0.28);
    b.set(6, -10, '#f2c46a');
    b.set(9, -10, '#ffe4a0');
    for (const [x, y, a] of [[7, -13, 0.6], [9, -14, 0.5], [8, -16, 0.4], [10, -17, 0.3]] as const) b.set(x, y, `rgba(255,255,255,${a})`);
  } else {
    halo(b, 8, 1, 4, '#ff6a2a', 0.18);
  }
  return { base: s };
}

/** Forno de barro em cúpula sobre a bancada, com brasas na boca. */
export function microwave(): BufFurniture {
  const s = floorSheet(1, 1, 13);
  const b = s.buf;
  counterBase(b, 'plain');
  const c = N.clay;
  // Cúpula (colmeia): metade de elipse apoiada no tampo.
  for (let y = -11; y <= 1; y++) {
    const t = (y - 1) / 12;
    const hw = 7 * Math.sqrt(Math.max(0, 1 - t * t));
    const x0 = Math.round(7.5 - hw);
    const x1 = Math.round(7.5 + hw);
    b.hline(x0, x1, y, c.base);
    b.set(x0, y, c.lt);
    b.set(x0 + 1, y, c.lt);
    b.set(x1, y, c.dk);
    if (x1 - 1 > x0 + 1) b.set(x1 - 1, y, c.dk);
  }
  b.hline(5, 9, -11, c.lt);
  b.set(5, -9, c.hi);
  b.set(4, -7, c.hi);
  // Anéis de barro (construção em rolos).
  for (const [x0, x1, y] of [[3, 12, -6], [1, 14, -2]] as const) {
    for (let x = x0; x <= x1; x += 2) b.set(x, y, c.dk);
  }
  // Respiro no alto e base mais escura.
  b.hline(7, 8, -11, c.dd);
  b.hline(0, 15, 1, c.dk);
  // Boca em arco com o interior escuro.
  b.rect(5, -4, 6, 5, '#2a1912');
  b.hline(6, 9, -5, '#2a1912');
  b.set(5, -4, c.dk);
  b.set(10, -4, c.dk);
  b.hline(5, 10, 1, c.dd);
  b.outline();
  seamless(b);
  contact(b, 0, 14, 16, 3, 0.2);
  // Brasas e o pão assando (luz dentro da boca).
  halo(b, 7.5, -1, 4.5, '#ff8a2a', 0.35);
  b.hline(6, 9, 0, '#e0602e');
  b.set(7, 0, '#ffb04a');
  b.hline(6, 8, -2, '#d6a060');
  b.set(6, -2, '#f0c888');
  return { base: s };
}

/**
 * Baú de gelo: tampa abaulada de baú (coberta de geada, com pingentes) sobre um armário alto de tábuas com cintas
 * de ferro, blocos de gelo atrás da grade e a porta de baixo trancada.
 */
export function fridge(): BufFurniture {
  const s = floorSheet(1, 1, 26);
  const b = s.buf;
  const m = N.wood;
  // Corpo de tábuas.
  frontFace(b, 0, -16, 16, 30, m);
  b.vline(0, -16, 13, m.lt);
  b.rect(1, 14, 14, 2, N.woodDark.dd);
  for (const x of [4, 8, 12]) {
    b.vline(x, -15, 12, m.dk);
    b.vline(x + 1, -15, 12, m.base);
  }
  // Tampa de baú: meio cilindro visto de frente, mais claro no alto, com a junta escura embaixo.
  for (const [x0, x1, y] of [[4, 11, -24], [2, 13, -23], [1, 14, -22]] as const) b.hline(x0, x1, y, m.lt);
  b.rect(0, -21, 16, 5, m.base);
  b.hline(0, 15, -21, m.lt);
  b.vline(0, -21, -17, m.lt);
  b.vline(15, -21, -17, m.dk);
  b.hline(0, 15, -17, m.dd);
  for (const x of [5, 10]) b.vline(x, -21, -18, m.dk);
  // Geada cobrindo a tampa.
  for (const [x0, x1, y] of [[4, 11, -24], [2, 13, -23], [1, 14, -22], [0, 15, -21]] as const) b.hline(x0, x1, y, y < -22 ? '#f2fbff' : '#d6ecf6');
  for (const x of [1, 4, 6, 9, 12, 14]) b.set(x, -20, '#c4e2f0');
  // Cintas de ferro e o ferrolho da tampa.
  strap(b, 0, 15, -7, 3);
  strap(b, 0, 15, 11, 3);
  b.rect(7, -19, 2, 4, N.iron.base);
  b.vline(7, -19, -16, N.iron.lt);
  b.set(8, -15, N.iron.dd);
  // Janela do gelo: blocos azulados atrás de uma grade de ferro.
  b.rect(2, -14, 12, 6, '#a9d6ea');
  b.rect(3, -13, 4, 3, '#d8f0fa');
  b.rect(8, -13, 5, 3, '#c4e6f4');
  b.hline(3, 8, -10, '#bfe3f2');
  b.set(3, -13, '#ffffff');
  b.set(8, -13, '#ffffff');
  for (const x of [2, 6, 10, 13]) b.vline(x, -14, -9, N.iron.base);
  b.hline(2, 13, -14, N.iron.lt);
  b.hline(2, 13, -9, N.iron.dk);
  // Porta de baixo com tranca e uma runa.
  recess(b, 2, -4, 12, 14, m);
  b.rect(11, 0, 3, 4, N.iron.base);
  b.hline(11, 13, 0, N.iron.lt);
  b.set(12, 2, N.iron.dd);
  rune(b, 5, 1, 1, m.dd);
  // Pingentes de gelo na aresta da tampa.
  for (const [x, n] of [[1, 3], [3, 2], [5, 4], [10, 2], [12, 4], [14, 2]] as const) {
    b.vline(x, -16, -16 + n - 1, '#d4eef8');
    b.set(x, -16 + n - 1, '#9ccbe2');
  }
  b.outline();
  contact(b, 0, 13, 16, 4, 0.24);
  // Frio escapando pela grade (depois do contorno).
  halo(b, 8, -11, 6, '#bfe8ff', 0.22);
  for (const [x, y, a] of [[2, 14, 0.35], [5, 15, 0.25], [12, 14, 0.3]] as const) b.set(x, y, `rgba(220,240,255,${a})`);
  return { base: s };
}

/** Prateleira de provisões: queijo, pães, maçãs, potes e sacos (o uso é o mesmo da máquina de lanches). */
export function vendingMachine(): BufFurniture {
  const s = floorSheet(1, 1, 24);
  const b = s.buf;
  const m = N.wood;
  // Fundo e montantes.
  b.rect(2, -20, 12, 34, N.woodDark.dk);
  for (const x of [5, 9]) b.vline(x, -20, 13, N.woodDark.dd);
  b.rect(0, -22, 2, 36, m.base);
  b.vline(0, -22, 13, m.lt);
  b.rect(14, -22, 2, 36, m.dk);
  b.vline(15, -22, 13, m.dd);
  // Tampo e coroamento entalhado.
  topFace(b, 0, -24, 16, 3, m);
  for (let x = 1; x < 15; x += 2) b.set(x, -22, m.dd);
  // Prateleiras (tábuas com aresta clara).
  const shelf = (y: number) => {
    b.hline(1, 14, y, m.hi);
    b.hline(1, 14, y + 1, m.dk);
  };
  for (const y of [-12, -3, 6, 13]) shelf(y);
  // Em cima: linguiças penduradas e um queijo.
  b.hline(2, 8, -20, N.iron.dk);
  for (const x of [3, 5, 7]) {
    b.vline(x, -19, -15, '#9a4636');
    b.set(x, -19, '#c06a54');
    b.set(x, -15, '#6e2e24');
  }
  b.ellipse(11, -14.5, 2.6, 1.8, '#c9962e');
  b.ellipse(11, -15, 2.4, 1.2, '#f0cd62');
  b.set(10, -15, '#fff0a8');
  // Pães e maçãs.
  for (const x of [2, 7]) {
    b.rect(x, -6, 5, 3, '#c98d4a');
    b.hline(x + 1, x + 3, -6, '#e8b878');
    b.set(x + 2, -5, '#a8703a');
    b.set(x + 4, -4, '#a8703a');
  }
  for (const [x, y] of [[12, -5], [13, -4], [11, -4]] as const) {
    b.set(x, y, '#c8403a');
    b.set(x, y - 1, '#4c8a3c');
  }
  b.set(12, -6, '#ff8a7a');
  // Potes de barro, garrafa e mel.
  b.rect(2, 1, 3, 5, N.clay.base);
  b.hline(2, 4, 1, '#e9dcc0');
  b.set(2, 3, N.clay.lt);
  b.rect(6, 0, 2, 6, '#3f6e4a');
  b.set(6, 1, '#7fb88a');
  b.set(6, -1, '#c8a878');
  b.rect(9, 2, 4, 4, N.gold.base);
  b.hline(9, 12, 2, N.gold.hi);
  b.set(12, 4, N.gold.dk);
  // Embaixo: saco de grãos e um barrilete.
  b.rect(2, 9, 5, 4, '#b39c74');
  b.hline(3, 5, 8, '#cdb68c');
  b.set(4, 7, '#8a7452');
  b.set(6, 11, '#8f7a56');
  b.rect(9, 8, 4, 5, N.plank.base);
  b.vline(9, 8, 12, N.plank.lt);
  b.hline(9, 12, 9, N.iron.base);
  b.hline(9, 12, 11, N.iron.base);
  b.outline();
  contact(b, 0, 13, 16, 4, 0.26);
  s.rects = { glow: rectAt(s, 2, -20, 12, 33) };
  return { base: s };
}

/**
 * Corpo de barril em pé, de y0 a y1: aduelas de carvalho com bojo no meio, aros de ferro nas alturas `hoops` e o
 * tampo (elipse de tábuas) em cima.
 */
function barrelBody(b: PixelBuf, y0: number, y1: number, hoops: readonly number[]): void {
  const st = N.plank;
  const mid = (y0 + y1) / 2;
  const half = (y1 - y0) / 2;
  const hwAt = (y: number) => {
    const t = (y - mid) / half;
    return Math.round(5 + 1.3 * (1 - t * t));
  };
  for (let y = y0; y <= y1; y++) {
    const hw = hwAt(y);
    const x0 = 8 - hw;
    const x1 = 7 + hw;
    b.hline(x0, x1, y, st.base);
    b.set(x0, y, st.lt);
    b.set(x0 + 1, y, st.lt);
    b.set(x1, y, st.dd);
    b.set(x1 - 1, y, st.dk);
    for (let x = x0 + 3; x < x1 - 1; x += 3) b.set(x, y, st.dk);
  }
  for (const y of hoops) {
    const hw = hwAt(y);
    b.hline(8 - hw, 7 + hw, y, N.iron.lt);
    b.hline(8 - hw, 7 + hw, y + 1, N.iron.dk);
    b.set(8 - hw + 1, y, N.iron.hi);
  }
  b.ellipse(7.5, y0 - 1, 5, 1.6, st.lt);
  b.hline(4, 11, y0 - 2, st.hi);
  for (const x of [5, 8, 10]) b.set(x, y0 - 1, st.base);
}

/** Barril de carvalho em pé com aros de ferro e o batoque no tampo. */
export function barrel(): BufFurniture {
  const s = floorSheet(1, 1, 12);
  const b = s.buf;
  barrelBody(b, -8, 14, [-6, 3, 11]);
  b.rect(9, -10, 2, 1, N.wood.dd);
  b.outline();
  contact(b, 0, 13, 16, 4, 0.24);
  return { base: s };
}

/** Barril de hidromel num suporte baixo: torneira de bronze na frente e um chifre pendurado. */
export function waterCooler(): BufFurniture {
  const s = floorSheet(1, 1, 20);
  const b = s.buf;
  const st = N.plank;
  // Suporte.
  for (const x of [3, 11]) {
    b.rect(x, 8, 2, 8, N.woodDark.base);
    b.set(x, 8, N.woodDark.lt);
  }
  b.rect(2, 8, 12, 2, N.wood.base);
  b.hline(2, 13, 8, N.wood.lt);
  barrelBody(b, -14, 7, [-12, -4, 5]);
  // Runa de hidromel e torneira de bronze.
  rune(b, 6, -9, 3, st.dd);
  b.rect(7, 0, 2, 2, N.bronze.base);
  b.set(7, 0, N.bronze.hi);
  b.vline(8, 2, 3, N.bronze.dk);
  // Chifre de beber pendurado no prego.
  b.set(13, -7, N.iron.hi);
  b.line(13, -7, 14, -5, '#5a4632');
  b.set(14, -4, '#efe2c4');
  b.set(15, -3, '#efe2c4');
  b.set(14, -3, '#d9c08c');
  b.set(15, -2, '#c49a5e');
  b.set(15, -1, '#8a6038');
  b.set(14, -5, N.gold.base);
  b.outline();
  contact(b, 1, 13, 14, 4, 0.22);
  // Gota de hidromel.
  b.set(8, 5, 'rgba(232,170,60,0.9)');
  return { base: s };
}

export function cafeTable(): BufFurniture {
  const s = floorSheet(1, 1, 8);
  const b = s.buf;
  const t = N.plank;
  // Pé de tronco com raízes.
  b.rect(6, 7, 4, 7, N.wood.base);
  b.vline(6, 7, 13, N.wood.lt);
  b.vline(9, 7, 13, N.wood.dk);
  b.set(7, 10, N.wood.dd);
  b.hline(5, 10, 13, N.wood.dk);
  b.set(4, 14, N.wood.dk);
  b.set(11, 14, N.wood.dk);
  // Tampo grosso redondo, com anéis da madeira.
  b.ellipse(8, 5.6, 7, 3.4, t.dk);
  b.ellipse(8, 4.7, 7, 3.2, t.lt);
  b.ellipse(8, 4.7, 4, 1.7, t.base);
  b.ellipse(8, 4.7, 3, 1.1, t.lt);
  b.set(3, 3, t.hi);
  b.set(4, 2, t.hi);
  // Vela num pires de ferro.
  b.ellipse(10.5, 4, 2, 1, N.iron.base);
  candle(b, 10, -1, 4);
  b.outline();
  candleFlame(b, 10, -2);
  contact(b, 3, 13, 10, 3, 0.22);
  return { base: s };
}

const SEAT = N.leather;

/** Cadeira entalhada com assento de couro. variant = para onde olha quem senta; 'up' tem `front` (encosto). */
export function cafeChair(variant: string | undefined): BufFurniture {
  const v = variant ?? 'down';
  const s = floorSheet(1, 1, 12);
  const b = s.buf;
  const w = N.wood;
  const legs = () => {
    for (const x of [4, 11]) b.vline(x, 9, 15, N.woodDark.base);
    for (const x of [5, 10]) b.vline(x, 9, 13, N.woodDark.dk);
  };
  const seat = () => {
    b.rect(3, 5, 10, 4, SEAT.lt);
    b.hline(3, 12, 5, SEAT.hi);
    b.hline(3, 12, 8, SEAT.dk);
    b.hline(3, 12, 9, w.dk);
    stud(b, 3, 7);
    stud(b, 12, 7);
  };
  /** Encosto de frente: montantes com pomo, travessa de cima entalhada e ripas. */
  const backFront = (y: number) => {
    for (const x of [3, 12]) {
      b.vline(x, y, 5, w.base);
      b.set(x, y - 1, w.lt);
    }
    b.vline(3, y, 5, w.lt);
    b.rect(3, y + 1, 10, 2, w.base);
    b.hline(4, 11, y + 1, w.hi);
    b.hline(4, 11, y + 2, w.dk);
    for (const x of [5, 7, 8, 10]) b.vline(x, y + 3, y + 6, w.dk);
    b.hline(4, 11, y + 7, w.base);
    b.set(7, y + 1, N.gold.hi);
    b.set(8, y + 1, N.gold.base);
  };
  legs();
  if (v === 'down') {
    backFront(-8);
    seat();
    b.outline();
    contact(b, 2, 13, 12, 3, 0.2);
    return { base: s };
  }
  if (v === 'up') {
    seat();
    b.outline();
    contact(b, 2, 13, 12, 3, 0.2);
    // De costas: o encosto (visto por trás) cobre o quadril de quem senta.
    const front = floorSheet(1, 1, 12);
    const f = front.buf;
    for (const x of [3, 12]) {
      f.vline(x, 1, 10, w.dk);
      f.set(x, 0, w.base);
    }
    f.rect(3, 2, 10, 2, w.base);
    f.hline(3, 12, 2, w.lt);
    f.hline(3, 12, 3, w.dk);
    for (const x of [5, 7, 8, 10]) f.vline(x, 4, 7, w.dd);
    f.hline(3, 12, 8, w.dk);
    f.outline();
    return { base: s, front };
  }
  // left/right: encosto lateral (do lado oposto ao olhar), com pomo dourado.
  seat();
  const bx = v === 'left' ? 11 : 3;
  b.rect(bx, -7, 2, 15, w.base);
  b.vline(bx, -7, 7, w.lt);
  b.hline(bx, bx + 1, -8, w.hi);
  for (const y of [-4, 0]) b.hline(bx, bx + 1, y, w.dd);
  b.set(bx, -7, N.gold.hi);
  b.outline();
  contact(b, 2, 13, 12, 3, 0.2);
  return { base: s };
}
