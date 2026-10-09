// Asgard, sala do trono: o trono de Odin com Huginn e Muninn, Geri e Freki deitados, as colunas entalhadas,
// a Bifrost (o "elevador" por onde todos chegam), o balcão de recepção e o banco de espera.
import { mix } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { floorSheet, wallSheet, type BufFurniture } from '../core/sprite';
import { contact, frontFace, topFace } from '../furniture/kit';
import { N, candle, candleFlame, halo, pelt, recess, rune, stud, zigzag } from './saloes-kit';

const W = N.wood;
const G = N.gold;

// ------------------------------------------------------------------ trono

/** Corvo pousado (8x6), olhando para a direita; `flip` olha para a esquerda. (x, y) = canto superior esquerdo. */
function raven(b: PixelBuf, x: number, y: number, flip: boolean): void {
  b.stamp(['....kk..', '...kkke.', '..kkkkBB', '.kwwkk..', 'kkwwk...', 'kk.f....'], x, y, { k: '#262a38', w: '#3d4a6c', e: '#f2d36b', B: '#7a7f8e', f: '#4a4d5a' }, flip);
}

/** Yggdrasil dourada (9x8): copa cheia com galhos vazados, tronco e raízes. (x, y) = canto superior esquerdo. */
function yggdrasil(b: PixelBuf, x: number, y: number): void {
  b.stamp(['..ooooo..', '.ooooooo.', 'ooo.o.ooo', '.o..o..o.', '....o....', '....o....', '..o.o.o..', '.o..o..o.'], x, y, { o: G.base });
  b.stamp(['..hhh....', '.hh......', 'h........'], x, y, { h: G.hi });
  b.stamp(['.........', '......dd.', '.......dd'], x, y, { d: G.dk });
}

/**
 * Trono de Odin (2x1), de frente para a câmera: madeira escura e ouro, espaldar alto com a Yggdrasil, montantes
 * com Huginn e Muninn pousados, assento de veludo vermelho com pele e degrau de pedra. Desenhado vazio; quem
 * senta (o Odin) fica no centro e cobre o meio do espaldar, o que fica à mostra é a coroa e os braços.
 */
export function throne(): BufFurniture {
  const s = floorSheet(2, 1, 28);
  const b = s.buf;
  // Degrau de pedra.
  topFace(b, -2, 10, 36, 3, N.stone);
  b.rect(-2, 13, 36, 3, N.stone.base);
  b.hline(-2, 33, 15, N.stone.dk);
  for (const x of [6, 17, 27]) b.vline(x, 13, 15, N.stone.dk);
  // Espaldar alto com a coroa em arco.
  b.rect(4, -21, 24, 23, W.base);
  for (const [x0, x1, y] of [[8, 23, -23], [6, 25, -22]] as const) b.hline(x0, x1, y, W.base);
  b.hline(9, 22, -23, G.hi);
  b.hline(7, 8, -22, G.base);
  b.hline(23, 24, -22, G.base);
  b.vline(4, -21, 1, W.lt);
  b.vline(27, -21, 1, W.dk);
  recess(b, 7, -19, 18, 20, W);
  b.hline(6, 25, -21, G.dk);
  yggdrasil(b, 12, -18);
  zigzag(b, 8, 23, -9, W);
  // Montantes com pomos de ouro (onde pousam os corvos).
  for (const x of [1, 27]) {
    b.rect(x, -20, 4, 22, W.base);
    b.vline(x, -20, 1, W.lt);
    b.vline(x + 3, -20, 1, W.dd);
    b.rect(x, -22, 4, 2, G.base);
    b.hline(x, x + 3, -22, G.hi);
    b.set(x + 3, -21, G.dk);
    for (const y of [-14, -6]) b.hline(x, x + 3, y, G.dk);
  }
  // Assento de veludo com a pele de lobo caindo pela frente.
  b.rect(5, 0, 22, 6, N.red.base);
  b.hline(5, 26, 0, N.red.hi);
  b.hline(5, 26, 1, N.red.lt);
  b.hline(5, 26, 5, N.red.dk);
  pelt(b, 11, 2, 11, 5, N.furGray, 11);
  // Frente do assento: painel entalhado com faixa dourada.
  b.rect(4, 6, 24, 5, W.dk);
  b.hline(4, 27, 6, G.base);
  b.hline(4, 27, 7, G.dk);
  zigzag(b, 5, 26, 8, W);
  // Braços: tábua grossa com remate de ouro na ponta.
  for (const x of [0, 26]) {
    b.rect(x, -6, 6, 17, W.base);
    b.hline(x, x + 5, -7, W.hi);
    b.hline(x, x + 5, -6, W.lt);
    b.hline(x, x + 5, -4, W.dk);
    b.vline(x, -5, 10, W.lt);
    b.vline(x + 5, -5, 10, W.dd);
    b.rect(x + 1, -3, 4, 2, G.base);
    b.hline(x + 1, x + 4, -3, G.hi);
    stud(b, x + 2, 4);
  }
  // Huginn (à esquerda) e Muninn (à direita), virados para o centro.
  raven(b, -1, -28, false);
  raven(b, 25, -28, true);
  b.outline();
  contact(b, -2, 13, 36, 4, 0.26);
  return { base: s };
}

/**
 * Lobo cinzento deitado (Geri ou Freki), de perfil: cabeça erguida com orelhas em ponta, sela escura no dorso,
 * patas da frente esticadas e a cauda enrolada junto ao corpo. variant 'right' | 'left' = para onde olha.
 */
export function wolf(variant: string | undefined): BufFurniture {
  const s = floorSheet(1, 1, 6);
  const b = s.buf;
  const f = N.furGray;
  b.stamp(
    [
      '..............D.d.....',
      '.............DDdpd....',
      '............dbllbbd...',
      '...........dbllbeblll.',
      '..........dbbbbbwwwwwn',
      '.........dbbbbbwwdddd.',
      '....DDDDDDDDdbbbl.....',
      '...dDDblllllllbbbbl...',
      '..dbbbldlllllbbbbbbl..',
      '.ddbbbbbdbbbbbbbbbbb..',
      'Dblbdblllwwwwlllllllww',
      '.DDdddbbbbbbbbbbbbbwd.',
    ],
    -4,
    2,
    { D: f.dd, d: f.dk, b: f.base, l: f.lt, w: '#d3d7dd', e: '#f2c24a', n: '#22242c', p: '#c99a8a' },
  );
  b.outline();
  contact(b, -4, 12, 22, 4, 0.24);
  if (variant === 'left') {
    const flipped = b.flipped();
    flipped.ox = b.ox;
    flipped.oy = b.oy;
    return { base: { ...s, buf: flipped } };
  }
  return { base: s };
}

/**
 * Coluna de madeira entalhada (2,5 tiles: duas colunas a 3 tiles uma da outra não se encostam): capitel largo,
 * fuste com cintas de ferro e base de pedra.
 */
export function pillar(): BufFurniture {
  const s = floorSheet(1, 1, 24);
  const b = s.buf;
  // Base de pedra.
  topFace(b, 0, 8, 16, 3, N.stone);
  b.rect(0, 11, 16, 4, N.stone.base);
  b.hline(0, 15, 14, N.stone.dk);
  b.vline(15, 11, 14, N.stone.dk);
  // Fuste (cilindro): luz à esquerda, sombra à direita, caneluras e a faixa entalhada.
  b.rect(3, -19, 10, 28, W.base);
  b.vline(3, -19, 8, W.lt);
  b.vline(4, -19, 8, W.hi);
  b.vline(11, -19, 8, W.dk);
  b.vline(12, -19, 8, W.dd);
  for (const x of [6, 9]) b.vline(x, -19, 8, W.dk);
  recess(b, 5, -12, 6, 9, W);
  zigzag(b, 5, 10, -11, W);
  zigzag(b, 5, 10, -7, W);
  // Cintas de ferro com rebites.
  for (const y of [-16, -2, 5]) {
    b.hline(2, 13, y, N.iron.lt);
    b.hline(2, 13, y + 1, N.iron.dk);
    for (const x of [4, 8, 11]) b.set(x, y, N.iron.hi);
  }
  // Capitel: bloco largo com volutas e topo iluminado.
  topFace(b, 0, -24, 16, 3, W);
  b.rect(0, -21, 16, 3, W.base);
  b.hline(0, 15, -19, W.dd);
  b.vline(0, -21, -19, W.lt);
  b.vline(15, -21, -19, W.dk);
  for (const x of [2, 12]) {
    b.set(x, -20, W.dd);
    b.set(x + 1, -20, W.hi);
  }
  stud(b, 7, -21);
  stud(b, 8, -21);
  b.outline();
  contact(b, -1, 13, 18, 4, 0.26);
  return { base: s };
}

// ------------------------------------------------------------------ Bifrost

/** Faixas do arco-íris, de fora (vermelho) para dentro (violeta); o núcleo é luz branca. */
const RAINBOW = ['#ff5f5f', '#ffa043', '#ffde5c', '#6fdc7f', '#57b2ff', '#9c7bff'] as const;
const CORE = '#f6fbff';
/** Fundo do vão apagado: o céu escuro entre os mundos. */
const RECESS = '#1c1f3c';

/**
 * A Bifrost (no lugar do elevador): portal em arco de pedra com runas, cheio de luz de arco-íris. state 0..4 =
 * apagado .. aberto: a luz abre do centro para fora (1 = só o núcleo, 4 = o arco-íris inteiro, com as runas e a
 * pedra-chave acesas e a luz escorrendo no chão).
 */
export function elevator(state: number): BufFurniture {
  const s = wallSheet(2, 2);
  const b = s.buf;
  const st = Math.max(0, Math.min(4, Math.round(state)));
  const sn = N.stone;
  const cx = 16;
  const cy = -14;
  /** Raio normalizado do arco (lados retos abaixo do centro, elipse acima). */
  const radius = (x: number, y: number, rx: number, ry: number) => {
    const dx = (x + 0.5 - cx) / rx;
    if (y + 0.5 >= cy) return Math.abs(dx);
    const dy = (y + 0.5 - cy) / ry;
    return Math.sqrt(dx * dx + dy * dy);
  };
  // Moldura de pedra: aduelas com juntas, ombreiras com fiadas e base.
  for (let y = -28; y <= 0; y++) {
    for (let x = 0; x < 32; x++) {
      if (radius(x, y, 16, 14) > 1) continue;
      let c: string = sn.base;
      if (x < 2) c = sn.lt;
      else if (x > 29) c = sn.dk;
      else if (y < cy - 8) c = sn.lt;
      b.set(x, y, c);
    }
  }
  for (const y of [-8, -2]) {
    b.hline(0, 2, y, sn.dk);
    b.hline(29, 31, y, sn.dd);
  }
  for (const [x0, y0, x1, y1] of [[4, -20, 2, -22], [9, -25, 8, -27], [22, -25, 23, -27], [27, -20, 29, -22]] as const) b.line(x0, y0, x1, y1, sn.dk);
  // Pedra-chave saliente no alto.
  b.rect(14, -29, 4, 5, sn.lt);
  b.hline(14, 17, -29, sn.hi);
  b.vline(17, -28, -25, sn.dk);
  // Vão: escuro (com o arco-íris adormecido) e, conforme o estado, a luz abrindo do centro para fora.
  const kmin = [99, 6, 4, 2, 0][st];
  for (let y = -25; y <= 0; y++) {
    for (let x = 3; x < 29; x++) {
      const r = radius(x, y, 12.5, 11);
      if (r > 1) continue;
      const k = Math.floor(((1 - r) * 12.5) / 2);
      const band = k >= RAINBOW.length ? CORE : RAINBOW[k];
      if (k >= kmin) b.set(x, y, band);
      else b.set(x, y, mix(RECESS, band, st === 0 ? 0.1 : 0.2));
    }
  }
  // Estrelas no escuro que ainda não acendeu.
  for (const [x, y] of [[6, -6], [24, -10], [9, -17], [21, -4], [13, -12], [18, -20], [5, -13], [26, -2]] as const) {
    const r = radius(x, y, 12.5, 11);
    if (r <= 1 && Math.floor(((1 - r) * 12.5) / 2) < kmin) b.set(x, y, '#8a94c4');
  }
  // Soleira de pedra.
  b.hline(0, 31, 0, sn.dk);
  b.hline(3, 28, -1, st > 0 ? mix(sn.lt, CORE, st / 5) : sn.base);
  // Runas nas ombreiras: sulcos apagados; acesas (ouro esbranquiçado) conforme a abertura.
  const runeC = st === 0 ? sn.dd : mix(G.lt, CORE, (st - 1) / 4);
  for (const [i, y] of [[0, -20], [2, -14], [4, -8]] as const) {
    rune(b, 0, y, i, runeC);
    rune(b, 29, y, i + 1, runeC);
  }
  b.outline();
  // Brilhos (depois do contorno): gema da pedra-chave, faíscas na luz e a luz escorrendo pela soleira.
  if (st === 0) {
    b.rect(15, -28, 2, 2, '#4a5568');
  } else {
    halo(b, 16, -27, 2 + st * 0.6, '#e8f4ff', 0.25 + st * 0.08);
    b.rect(15, -28, 2, 2, '#ffffff');
    for (const [x, y] of [[10, -14], [21, -18], [15, -8], [19, -5], [12, -21]] as const) {
      if (radius(x, y, 12.5, 11) < 1 - (kmin * 2) / 12.5) b.set(x, y, 'rgba(255,255,255,0.85)');
    }
    if (st >= 3) {
      halo(b, 16, -11, 16, '#cfe0ff', 0.12 + (st - 3) * 0.08);
      // A luz escorrendo pela soleira para o chão.
      b.hline(4, 27, 1, `rgba(236,240,255,${0.3 + (st - 3) * 0.2})`);
    }
  }
  return { base: s };
}

// ------------------------------------------------------------------ recepção

/** Balcão de recepção: painéis entalhados com runas de ouro, tampo de pedra, livro de registros e um chifre. */
export function receptionDesk(seed: number): BufFurniture {
  const s = floorSheet(3, 1, 20);
  const b = s.buf;
  // Área de trabalho (atrás): estante de leitura com o livro aberto, tinteiro e castiçal.
  topFace(b, 1, -10, 46, 6, N.plank);
  b.rect(8, -15, 11, 2, W.base);
  b.line(10, -13, 9, -10, W.dk);
  b.line(17, -13, 18, -10, W.dk);
  b.rect(8, -18, 11, 3, '#efe3c4');
  b.vline(13, -18, -16, '#b9a47a');
  for (const y of [-17, -16]) {
    b.hline(9, 12, y, '#8a7a62');
    b.hline(14, 17, y, '#8a7a62');
  }
  b.rect(24, -12, 3, 3, '#2a2e38');
  b.line(26, -12, 29, -16, '#e8e2d0');
  candle(b, 39, -17, 7);
  b.rect(38, -11, 4, 1, N.iron.base);
  // Balcão: três painéis rebaixados com runas de ouro, sobre rodapé escuro.
  frontFace(b, 0, -2, 48, 18, W);
  b.vline(0, -2, 15, W.lt);
  for (const [i, x] of [[0, 2], [1, 18], [2, 34]] as const) {
    recess(b, x, 0, 12, 10, W);
    rune(b, x + 5, 3, seed + i * 3, G.base);
  }
  b.rect(0, 11, 48, 2, G.base);
  b.hline(0, 47, 11, G.hi);
  b.rect(0, 13, 48, 3, W.dd);
  // Tampo de pedra (prateleira de atendimento).
  topFace(b, -1, -6, 50, 5, N.stone);
  b.hline(-1, 48, -2, N.stone.dk);
  // Pergaminho com runas, pena e um chifre de boas-vindas.
  b.rect(4, -5, 8, 3, '#efe3c4');
  b.hline(5, 10, -4, '#9a8a6a');
  b.vline(12, -5, -3, '#c9b48a');
  b.line(14, -3, 18, -6, '#e8e2d0');
  const hornTone = ['#efe2c4', '#d9bf8c', '#b08550', '#6e4a2e'];
  for (let i = 0; i < 8; i++) {
    const thick = i < 3 ? 2 : 1;
    for (let k = 0; k < thick; k++) b.set(38 - i, -4 + k - (i > 5 ? 1 : 0), hornTone[Math.min(3, Math.floor(i / 2))]);
  }
  b.vline(39, -5, -3, G.base);
  b.outline();
  candleFlame(b, 39, -18);
  contact(b, -1, 13, 50, 4, 0.24);
  return { base: s };
}

/** Banco de espera: assento de tábuas grossas com pele, encosto de duas travessas e pés robustos. */
export function bench(): BufFurniture {
  const s = floorSheet(2, 1, 12);
  const b = s.buf;
  // Pés e travessa de baixo.
  for (const x of [2, 27]) {
    b.rect(x, 8, 3, 8, W.base);
    b.vline(x, 8, 15, W.lt);
    b.vline(x + 2, 8, 15, W.dk);
  }
  b.hline(5, 26, 12, W.dk);
  // Encosto: montantes com pomo e duas travessas (a de cima entalhada).
  for (const x of [1, 29]) {
    b.rect(x, -9, 2, 11, W.base);
    b.vline(x, -9, 1, W.lt);
    b.set(x, -10, G.hi);
    b.set(x + 1, -10, G.base);
  }
  b.rect(1, -8, 30, 3, W.base);
  b.hline(1, 30, -8, W.hi);
  zigzag(b, 2, 29, -8, W);
  b.rect(1, -3, 30, 2, W.base);
  b.hline(1, 30, -3, W.lt);
  b.hline(1, 30, -2, W.dk);
  // Assento em duas tábuas grossas.
  for (const y of [2, 5]) {
    b.rect(0, y, 32, 3, N.plank.lt);
    b.hline(0, 31, y, N.plank.hi);
    b.hline(0, 31, y + 2, N.plank.dk);
  }
  b.rect(0, 8, 32, 1, W.dd);
  for (const x of [5, 26]) stud(b, x, 3);
  pelt(b, 17, 2, 11, 5, N.fur, 7);
  b.outline();
  contact(b, 0, 13, 32, 3, 0.22);
  return { base: s };
}
