// Kit nórdico dos móveis de trabalho de Asgard (puro): materiais, entalhes, ferragens, peles, fogo, runas e o
// pergaminho mágico que faz as vezes de monitor. Mesma convenção 3/4 do Escritório (furniture/kit.ts): topo claro com
// aresta frontal brilhante, frente em base/dk, luz de cima/esquerda e contorno automático (PixelBuf.outline).
//
// Brilhos (chamas, runas acesas, faíscas de magia) não podem ganhar contorno escuro: quem desenha empilha esses
// traços numa lista de `Luzes` e chama `acende` DEPOIS do outline.
import { mix, ramp, shade, withAlpha, type Ramp } from '../core/color';
import type { PixelBuf } from '../core/pixbuf';
import { rngOf } from '../furniture/kit';

export type Box = { x: number; y: number; w: number; h: number };

/** Materiais (rampas de 5 tons: hi, lt, base, dk, dd). */
export const N = {
  carvalho: ramp('#6b4731', 0.065), // madeira escura entalhada (padrão dos móveis)
  pinho: ramp('#97683f', 0.065), // madeira quente
  freixo: ramp('#c2a47a', 0.055), // freixo claro
  ebano: ramp('#4a3227', 0.06), // madeira quase negra
  pedra: ramp('#808b98', 0.06), // pedra cinza-azulada
  ferro: ramp('#5c626e', 0.07),
  ouro: ramp('#d6a335', 0.08),
  couro: ramp('#8a5935', 0.07),
  pele: ramp('#9d968b', 0.06), // pelego de lobo
  pergaminho: ramp('#ecdcb1', 0.045),
  vime: ramp('#c29855', 0.07),
} as const;

/** Luz das runas (magia). */
export const MAGIA = { hi: '#effcff', lt: '#a9efff', base: '#5ed2f2', dk: '#3796c2' } as const;
/** Fogo: miolo, brilho, corpo, borda e ponta. */
export const FOGO = { core: '#fff8d6', hi: '#ffe37a', base: '#ffb23c', dk: '#f07428', dd: '#c8461f' } as const;
/** Tinta sépia (escrita no pergaminho). */
export const SEPIA = '#7d5a3c';
/** Sombra de objeto pousado (madeira escura pede um tom mais firme que o do Escritório). */
export const SOMBRA = 'rgba(30,16,10,0.32)';

// ------------------------------------------------------------------ luzes (depois do contorno)

export type Luzes = (() => void)[];

export function acende(luzes: Luzes): void {
  for (const f of luzes) f();
}

/** Halo suave POR BAIXO do que já existe (só aparece no vazio em volta do sprite). */
export function halo(b: PixelBuf, cx: number, cy: number, rx: number, ry: number, color: string, alpha: number): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      b.under(x, y, withAlpha(color, alpha * (d < 0.35 ? 1 : d < 0.7 ? 0.6 : 0.3)));
    }
  }
}

/** Faísca de 4 pontas (1 px no centro, braços translúcidos). */
export function faisca(b: PixelBuf, x: number, y: number, color: string = MAGIA.lt): void {
  b.set(x, y, MAGIA.hi);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) b.set(x + dx, y + dy, withAlpha(color, 0.55));
}

// ------------------------------------------------------------------ fogo

const CHAMA_PAL = { o: FOGO.dk, r: FOGO.dd, y: FOGO.hi, b: FOGO.base, w: FOGO.core } as const;

/** Chama pequena de vela (3x4); (x, y) = canto superior esquerdo. */
export function chamaVela(b: PixelBuf, x: number, y: number): void {
  b.stamp(['.o.', '.y.', 'oyo', '.w.'], x, y, CHAMA_PAL);
}

/** Chama de tocha (5x7); (x, y) = canto superior esquerdo. */
export function chamaTocha(b: PixelBuf, x: number, y: number): void {
  b.stamp(['..r..', '..o..', '.obo.', '.oyo.', 'obywo', 'obwyo', '.byb.'], x, y, CHAMA_PAL);
}

/**
 * Chama em gota de tamanho livre (braseiro): (cx, base) = centro da base, h = altura, w = largura máxima.
 * Miolo claro embaixo, corpo laranja, borda e ponta avermelhadas.
 */
export function chama(b: PixelBuf, cx: number, base: number, h: number, w: number): void {
  for (let i = 0; i < h; i++) {
    const t = h > 1 ? i / (h - 1) : 0;
    const half = (w / 2) * (t < 0.3 ? 0.7 + t : Math.max(0.18, (1 - t) * 1.42));
    const y = base - i;
    for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) {
      const d = Math.abs(x + 0.5 - cx) / Math.max(0.5, half);
      let c: string = FOGO.base;
      if (t > 0.82 || d > 0.78) c = t > 0.9 ? FOGO.dd : FOGO.dk;
      else if (d < 0.4 && t < 0.35) c = FOGO.core;
      else if (d < 0.55 && t < 0.62) c = FOGO.hi;
      b.set(x, y, c);
    }
  }
}

// ------------------------------------------------------------------ madeira entalhada e ferragens

/** Friso entalhado (corda torcida) de 3 linhas: fios em diagonal sobre o fundo rebaixado. */
export function friso(b: PixelBuf, x: number, y: number, w: number, m: Ramp, fase = 0): void {
  for (let i = 0; i < w; i++) {
    const k = (i + fase) % 4;
    b.set(x + i, y, k < 2 ? m.lt : m.dk);
    b.set(x + i, y + 1, k === 1 || k === 2 ? m.base : m.dk);
    b.set(x + i, y + 2, k >= 2 ? m.base : m.dd);
  }
}

/** Friso vertical (corda torcida em coluna) de 3 colunas. */
export function frisoV(b: PixelBuf, x: number, y: number, h: number, m: Ramp, fase = 0): void {
  for (let i = 0; i < h; i++) {
    const k = (i + fase) % 4;
    b.set(x, y + i, k < 2 ? m.lt : m.dk);
    b.set(x + 1, y + i, k === 1 || k === 2 ? m.base : m.dk);
    b.set(x + 2, y + i, k >= 2 ? m.base : m.dd);
  }
}

/** Pomo de ouro 2x2 (pontas de rolos, postes e varões). */
export function pomo(b: PixelBuf, x: number, y: number, m: Ramp = N.ouro): void {
  b.set(x, y, m.hi);
  b.set(x + 1, y, m.lt);
  b.set(x, y + 1, m.base);
  b.set(x + 1, y + 1, m.dk);
}

/** Rebite (cabeça de cravo) de 1 px com brilho. */
export function rebite(b: PixelBuf, x: number, y: number, m: Ramp = N.ferro): void {
  b.set(x, y, m.hi);
}

/** Tábuas horizontais num tampo: frestas escuras, veio leve e cavilhas. */
export function tabuas(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp, seed: number, larg = 4): void {
  const r = rngOf(seed, 61);
  for (let yy = y + larg; yy < y + h - 1; yy += larg) {
    b.hline(x, x + w - 1, yy, m.dk);
    // emendas desencontradas
    const cut = x + 3 + Math.floor(r() * Math.max(1, w - 6));
    b.set(cut, yy - 1, m.dk);
    b.set(cut, yy - 2, m.base);
  }
  for (let yy = y + 1; yy < y + h - 1; yy += 2) {
    if (r() < 0.45) continue;
    const x0 = x + Math.floor(r() * w);
    const len = 2 + Math.floor(r() * (w / 3));
    for (let xx = x0; xx < Math.min(x + w, x0 + len); xx++) if ((yy - y) % larg !== 0) b.set(xx, yy, m.base);
  }
}

/** Sombra suave projetada na parede (abaixo/direita do objeto), como em furniture/wall.ts. */
export function sombraParede(b: PixelBuf, x: number, y: number, w: number, h: number): void {
  for (let yy = y + 1; yy <= y + h; yy++) b.under(x + w, yy, 'rgba(24,16,12,0.22)');
  for (let xx = x + 1; xx <= x + w; xx++) b.under(xx, y + h, 'rgba(24,16,12,0.22)');
}

// ------------------------------------------------------------------ pelos e tecidos

/** Pelego: base, mechas claras/escuras e franja irregular embaixo. */
export function pelego(b: PixelBuf, x: number, y: number, w: number, h: number, m: Ramp, seed: number): void {
  const r = rngOf(seed, 71);
  b.rect(x, y, w, h, m.base);
  b.hline(x, x + w - 1, y, m.lt);
  for (let i = 0; i < w * h * 0.35; i++) {
    const xx = x + Math.floor(r() * w);
    const yy = y + Math.floor(r() * h);
    b.set(xx, yy, r() < 0.5 ? m.lt : m.dk);
    if (yy + 1 < y + h) b.set(xx, yy + 1, m.dk);
  }
  for (let xx = x; xx < x + w; xx++) if (r() < 0.55) b.set(xx, y + h, m.dk);
}

// ------------------------------------------------------------------ runas

/** Runas do futhark em 3x5 (estilizadas para ler bem em 1 px). */
const RUNAS: readonly (readonly string[])[] = [
  ['#.#', '##.', '#.#', '#..', '#..'], // fehu
  ['##.', '#.#', '##.', '#.#', '#.#'], // raido
  ['#..', '##.', '#.#', '##.', '#..'], // thurisaz
  ['#.#', '###', '.#.', '.#.', '.#.'], // algiz
  ['.#.', '#.#', '.#.', '.#.', '.#.'], // tiwaz
  ['.#.', '#.#', '.#.', '#.#', '#.#'], // othala
  ['..#', '.#.', '#..', '.#.', '..#'], // kenaz
  ['#.#', '#.#', '.#.', '#.#', '#.#'], // gebo
  ['#..', '##.', '.#.', '.##', '..#'], // sowilo
  ['##.', '#.#', '##.', '#.#', '##.'], // berkanan
  ['.#.', '##.', '.##', '.#.', '.#.'], // naudiz
  ['#.#', '###', '#.#', '#.#', '#.#'], // mannaz
];

/** Runas mínimas (3x3) para superfícies pequenas. */
const RUNINHAS: readonly (readonly string[])[] = [
  ['#.#', '.#.', '.#.'],
  ['.#.', '##.', '.#.'],
  ['#..', '##.', '#..'],
  ['.#.', '#.#', '.#.'],
  ['##.', '#.#', '#..'],
  ['#.#', '.#.', '#.#'],
];

export function runa(b: PixelBuf, x: number, y: number, i: number, color: string): void {
  b.stamp(RUNAS[((i % RUNAS.length) + RUNAS.length) % RUNAS.length], x, y, { '#': color });
}

export function runinha(b: PixelBuf, x: number, y: number, i: number, color: string): void {
  b.stamp(RUNINHAS[((i % RUNINHAS.length) + RUNINHAS.length) % RUNINHAS.length], x, y, { '#': color });
}

/** Linha de "texto rúnico": traços curtos com espaços, como escrita miúda. */
export function linhaRunica(b: PixelBuf, x: number, y: number, w: number, color: string, seed: number): void {
  const r = rngOf(seed, 83);
  let xx = x;
  while (xx < x + w) {
    const len = 1 + Math.floor(r() * 3);
    for (let k = 0; k < len && xx < x + w; k++, xx++) b.set(xx, y, color);
    xx += 1;
  }
}

// ------------------------------------------------------------------ pergaminho mágico (o "monitor")

/** Folha de pergaminho: base, manchas de idade e bordas um tom abaixo. */
function folhaPergaminho(b: PixelBuf, x: number, y: number, w: number, h: number, seed: number, tom = 0): void {
  const p = ramp(shade(N.pergaminho.base, tom), 0.045);
  const r = rngOf(seed, 91);
  b.rect(x, y, w, h, p.base);
  for (let i = 0; i < (w * h) / 9; i++) b.set(x + Math.floor(r() * w), y + Math.floor(r() * h), r() < 0.5 ? p.lt : p.dk);
  b.vline(x, y, y + h - 1, p.dk);
  b.vline(x + w - 1, y, y + h - 1, p.dk);
}

/**
 * Pergaminho mágico em pé sobre um suporte entalhado: dois rolos de madeira com pomos de ouro e a folha esticada
 * entre eles. (x, y, w, h) é a mesma caixa do monitorFront do Escritório e a área devolvida (onde o mundo desenha as
 * runas) é a mesma da tela: (x+1, y+1, w-2, h-2). A borda da folha brilha (a luz vem da magia) e um cristal no
 * suporte acende depois do contorno.
 */
export function pergaminhoEmPe(b: PixelBuf, x: number, y: number, w: number, h: number, luz: Luzes, seed = 0): Box {
  const m = N.carvalho;
  const sx = x + 1;
  const sy = y + 1;
  const sw = w - 2;
  const sh = h - 2;
  // Sombra no tampo (luz de cima/esquerda).
  b.hline(x + 1, x + w + 1, y + h + 2, SOMBRA);
  // Folha: margem de 1 px clara em cima e embaixo (brilho mágico), miolo de pergaminho.
  b.rect(x, y, w, h, MAGIA.lt);
  b.hline(x + 1, x + w - 2, y, MAGIA.hi);
  folhaPergaminho(b, sx, sy, sw, sh, seed);
  // Rolos laterais (2 px), um pouco mais altos que a folha, com pomos de ouro.
  for (const rx of [x - 1, x + w - 1]) {
    b.rect(rx, y - 1, 2, h + 2, m.base);
    b.vline(rx, y - 1, y + h, m.lt);
    b.vline(rx + 1, y - 1, y + h, m.dk);
    b.set(rx, y + Math.floor(h / 2), m.hi);
    pomo(b, rx, y - 3);
  }
  // Suporte: travessa entalhada com pés nas pontas.
  b.rect(x - 2, y + h, w + 4, 2, m.base);
  b.hline(x - 2, x + w + 1, y + h, m.lt);
  b.hline(x - 2, x + w + 1, y + h + 1, m.dk);
  b.set(x - 2, y + h + 1, m.dd);
  b.set(x + w + 1, y + h + 1, m.dd);
  const cx = x + Math.floor(w / 2) - 1;
  b.rect(cx, y + h, 2, 2, N.ouro.base);
  b.set(cx, y + h, N.ouro.hi);
  luz.push(() => {
    b.set(cx, y + h, MAGIA.hi);
    b.set(cx + 1, y + h + 1, MAGIA.base);
    faisca(b, x + 1, y - 3);
    b.set(x + w - 3, y - 2, withAlpha(MAGIA.lt, 0.8));
  });
  return { x: sx, y: sy, w: sw, h: sh };
}

/**
 * Verso do pergaminho em pé (desk_back): rolos, folha vista por trás (pergaminho mais cru, nunca escuro como a
 * frente acesa), runas espelhadas transparecendo e um lacre de cera no meio. Mesma caixa do monitorBack.
 */
export function pergaminhoVerso(b: PixelBuf, x: number, y: number, w: number, h: number, seed = 0): void {
  const m = N.carvalho;
  const r = rngOf(seed, 93);
  b.hline(x + 1, x + w + 1, y + h + 2, SOMBRA);
  folhaPergaminho(b, x, y, w, h, seed + 5, -0.05);
  b.hline(x, x + w - 1, y, shade(N.pergaminho.base, 0.02));
  // Runas da frente transparecendo pelo verso (bem fracas).
  for (let k = 0; k < 3; k++) {
    const ry = y + 2 + k * 2;
    if (ry >= y + h - 2) break;
    for (let xx = x + 2; xx < x + w - 2; xx += 2) if (r() < 0.55) b.set(xx, ry, mix(N.pergaminho.dk, MAGIA.dk, 0.35));
  }
  // Lacre de cera vermelha com fita.
  const cx = x + Math.floor(w / 2) - 1;
  const cy = y + Math.floor(h / 2) - 1;
  b.vline(cx + 1, y, y + h - 1, '#9b3a2c');
  b.rect(cx, cy, 3, 3, '#b8402f');
  b.set(cx, cy, '#d8604a');
  b.set(cx + 2, cy + 2, '#7e2a20');
  for (const rx of [x - 1, x + w - 1]) {
    b.rect(rx, y - 1, 2, h + 2, m.base);
    b.vline(rx, y - 1, y + h, m.lt);
    b.vline(rx + 1, y - 1, y + h, m.dk);
    pomo(b, rx, y - 3);
  }
  b.rect(x - 2, y + h, w + 4, 2, m.base);
  b.hline(x - 2, x + w + 1, y + h, m.lt);
  b.hline(x - 2, x + w + 1, y + h + 1, m.dk);
}

/** Conteúdo fixo (um pouco escurecido) de uma folha secundária: tabela de runas, texto ou mapa dos reinos. */
export type FolhaFixa = 'tabela' | 'texto' | 'mapa';

export function folhaFixa(b: PixelBuf, r: Box, kind: FolhaFixa, seed: number): void {
  const { x, y, w, h } = r;
  const rnd = rngOf(seed, 97);
  folhaPergaminho(b, x, y, w, h, seed + 3, -0.07);
  const ink = shade(SEPIA, 0.04);
  if (kind === 'tabela') {
    b.hline(x, x + w - 1, y, ink);
    for (let yy = y + 2; yy < y + h; yy += 2) b.hline(x + 1, x + w - 2, yy, mix(N.pergaminho.dk, ink, 0.4));
    for (let xx = x + 3; xx < x + w - 1; xx += 3) b.vline(xx, y + 1, y + h - 1, mix(N.pergaminho.dk, ink, 0.4));
    for (let k = 0; k < 4; k++) {
      const cx = x + 1 + 3 * Math.floor(rnd() * Math.max(1, Math.floor((w - 2) / 3)));
      const cy = y + 1 + 2 * Math.floor(rnd() * Math.max(1, Math.floor((h - 1) / 2)));
      b.set(cx, cy, k === 0 ? MAGIA.dk : ink);
      b.set(cx + 1, cy, k === 0 ? MAGIA.dk : ink);
    }
    return;
  }
  if (kind === 'mapa') {
    // Os nove reinos: a árvore no meio, galhos e raízes, e os reinos em pontos.
    const cx = x + Math.floor(w / 2);
    b.vline(cx, y + 1, y + h - 2, '#6b8a4a');
    b.line(cx, y + 2, x + 1, y + 1, '#6b8a4a');
    b.line(cx, y + 2, x + w - 2, y + 1, '#6b8a4a');
    b.line(cx, y + h - 2, x + 1, y + h - 1, SEPIA);
    b.line(cx, y + h - 2, x + w - 2, y + h - 1, SEPIA);
    for (const [dx, dy, c] of [[-3, 1, '#d6a335'], [3, 1, '#4f8fc0'], [0, 0, '#d6a335'], [-2, 3, '#4f9c68'], [2, 3, '#b8402f'], [0, h - 2, '#5a6a8a']] as const) {
      b.set(cx + dx, y + dy, c);
    }
    return;
  }
  for (let yy = y + 1; yy < y + h - 1; yy += 2) linhaRunica(b, x + 1, yy, w - 2 - Math.floor(rnd() * 3), yy === y + 3 ? MAGIA.dk : ink, seed + yy);
}

// ------------------------------------------------------------------ objetos pequenos (sobre mesas e prateleiras)

/** Caneca de madeira com aro de ferro e espuma de hidromel (5x6, com a alça). */
export function caneca(b: PixelBuf, x: number, y: number, m: Ramp = N.pinho): void {
  b.hline(x + 1, x + 4, y + 5, SOMBRA);
  b.rect(x, y + 1, 4, 4, m.base);
  b.vline(x, y + 1, y + 4, m.lt);
  b.vline(x + 3, y + 1, y + 4, m.dk);
  b.set(x + 1, y + 2, m.hi);
  b.hline(x, x + 3, y + 3, N.ferro.lt);
  b.set(x + 3, y + 3, N.ferro.base);
  b.hline(x, x + 3, y + 4, m.dk);
  b.hline(x, x + 3, y, '#f2e7cb');
  b.set(x + 1, y, '#fffaf0');
  b.set(x + 4, y + 1, m.dk);
  b.set(x + 4, y + 2, m.dk);
  b.set(x + 4, y + 3, m.dk);
}

/** Vela num pratinho de ferro; a chama entra em `luz`. (x, y) = topo da vela (2 px de largura). */
export function vela(b: PixelBuf, x: number, y: number, luz: Luzes, alt = 4): void {
  b.hline(x, x + 3, y + alt + 1, SOMBRA);
  b.hline(x - 1, x + 2, y + alt, N.ferro.lt);
  b.set(x + 2, y + alt, N.ferro.dk);
  b.rect(x, y, 2, alt, '#efe3c2');
  b.vline(x + 1, y, y + alt - 1, '#cdbd94');
  b.set(x, y + 1, '#f9f1dc');
  b.set(x, y - 1, '#3a2a20');
  luz.push(() => {
    chamaVela(b, x - 1, y - 5);
    halo(b, x + 0.5, y - 3, 3.5, 3.5, FOGO.hi, 0.18);
  });
}

/** Tinteiro de vidro escuro com uma pena. */
export function tinteiro(b: PixelBuf, x: number, y: number): void {
  b.hline(x + 1, x + 3, y + 3, SOMBRA);
  b.rect(x, y + 1, 3, 2, '#2f3547');
  b.set(x, y + 1, '#56617c');
  b.hline(x, x + 2, y, '#1f2331');
  b.line(x + 1, y - 1, x + 4, y - 5, '#efeadf');
  b.set(x + 3, y - 3, '#cfc6b4');
  b.set(x + 4, y - 4, '#cfc6b4');
  b.set(x + 5, y - 5, '#efeadf');
}

/** Tábua de runas (o "teclado"): pedra com runas entalhadas, algumas acesas. */
export function tabuaRunas(b: PixelBuf, x: number, y: number, w: number): void {
  const p = N.pedra;
  b.hline(x + 1, x + w, y + 3, SOMBRA);
  b.rect(x, y, w, 3, p.base);
  b.hline(x, x + w - 1, y, p.lt);
  b.hline(x, x + w - 1, y + 2, p.dk);
  for (let i = 1; i < w - 1; i += 2) b.set(x + i, y + 1, i % 6 === 3 ? MAGIA.base : p.dd);
}

/** Seixo rúnico (o "mouse"). */
export function seixo(b: PixelBuf, x: number, y: number): void {
  b.hline(x + 1, x + 2, y + 2, SOMBRA);
  b.rect(x, y, 2, 2, N.pedra.lt);
  b.set(x, y, N.pedra.hi);
  b.set(x + 1, y + 1, N.pedra.dk);
}

/** Folhas soltas de pergaminho com escrita sépia (os "papéis"). */
export function folhas(b: PixelBuf, x: number, y: number, w = 6, h = 4, seed = 0): void {
  const p = N.pergaminho;
  b.hline(x + 1, x + w, y + h, SOMBRA);
  b.rect(x + 1, y - 1, w, h, p.dk);
  b.rect(x, y, w, h, p.lt);
  b.hline(x, x + w - 1, y + h - 1, p.base);
  for (let i = 1; i < h - 1; i++) linhaRunica(b, x + 1, y + i, Math.max(1, w - 2 - (i % 2)), SEPIA, seed + i);
}

/** Corvo de Odin entalhado em madeira negra sobre uma base (5x6). */
export function corvo(b: PixelBuf, x: number, y: number): void {
  b.stamp(['..kk.', '.kkkb', 'kkkk.', '.kkk.', '..k..', 'wwwww'], x, y, { k: '#2b2a36', b: '#8a8a98', w: N.carvalho.lt });
  b.set(x + 2, y, '#4a4b62');
  b.set(x + 1, y + 1, '#4a4b62');
  b.set(x + 3, y + 1, N.ouro.hi);
}

/** Elmo de ferro com nasal (7x5). */
export function elmo(b: PixelBuf, x: number, y: number): void {
  const f = N.ferro;
  b.hline(x + 1, x + 7, y + 5, SOMBRA);
  b.stamp(['..lll..', '.lbbbd.', 'lbbbbbd', 'ggggggg', 'dd.n.dd'], x, y, { l: f.lt, b: f.base, d: f.dk, g: N.ouro.base, n: f.dk });
  b.set(x + 2, y, f.hi);
  b.set(x + 1, y + 2, f.hi);
}

/** Moedas de ouro empilhadas. */
export function moedas(b: PixelBuf, x: number, y: number): void {
  b.hline(x + 1, x + 3, y + 3, SOMBRA);
  b.hline(x, x + 2, y + 2, N.ouro.dk);
  b.hline(x, x + 2, y + 1, N.ouro.base);
  b.hline(x, x + 2, y, N.ouro.lt);
  b.set(x + 1, y, N.ouro.hi);
  b.set(x + 3, y + 2, N.ouro.lt);
}

/** Frasco de poção (3x5) com líquido colorido e rolha. */
export function frasco(b: PixelBuf, x: number, y: number, liquido: string): void {
  b.set(x + 1, y, '#8a6a4a');
  b.set(x + 1, y + 1, 'rgba(210,235,240,0.85)');
  b.rect(x, y + 2, 3, 3, liquido);
  b.set(x, y + 2, shade(liquido, 0.18));
  b.set(x + 2, y + 4, shade(liquido, -0.15));
}

/**
 * Chifre de beber deitado: boca larga com aro de ouro à esquerda (ou à direita com `flip`), afinando e subindo em
 * curva até a ponta. Marfim na boca, castanho na ponta. (x, y) = canto superior esquerdo da caixa (len x 5).
 */
export function chifre(b: PixelBuf, x: number, y: number, len = 10, flip = false): void {
  const set = (dx: number, yy: number, c: string) => b.set(flip ? x + len - 1 - dx : x + dx, yy, c);
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const thick = Math.max(1, Math.round(3.2 - t * 2.4));
    const bottom = y + 4 - Math.round(t * t * 4);
    const c = t < 0.45 ? mix('#f2e8cf', '#cfae7e', t / 0.45) : mix('#cfae7e', '#5a3f2c', (t - 0.45) / 0.55);
    for (let k = 0; k < thick; k++) set(i, bottom - k, k === thick - 1 ? shade(c, 0.08) : k === 0 && thick > 1 ? shade(c, -0.12) : c);
    if (i === 0) for (let k = 0; k < thick; k++) set(i, bottom - k, k === thick - 1 ? N.ouro.hi : N.ouro.base);
    if (i === Math.floor(len * 0.4)) for (let k = 0; k < thick; k++) set(i, bottom - k, N.ouro.dk);
  }
  set(len - 1, y, N.ouro.lt);
}

/** Livro grosso de couro com cantoneiras de ouro (lombada voltada para a frente). */
export function tomo(b: PixelBuf, x: number, y: number, w: number, h: number, color: string): void {
  b.rect(x, y, w, h, color);
  b.vline(x, y, y + h - 1, shade(color, 0.1));
  b.vline(x + w - 1, y, y + h - 1, shade(color, -0.14));
  if (h > 4) {
    b.hline(x, x + w - 1, y + 1, N.ouro.base);
    b.hline(x, x + w - 1, y + h - 2, N.ouro.dk);
  }
  if (h > 7 && w > 1) b.set(x + Math.floor(w / 2), y + Math.floor(h / 2), N.ouro.lt);
}

/** Cores de lombada (couros tingidos). */
export const COUROS = ['#7a2e2a', '#3e5a34', '#2f405e', '#6a4a30', '#9a7a3a', '#5a3550', '#8a3f2a', '#36514f'] as const;
