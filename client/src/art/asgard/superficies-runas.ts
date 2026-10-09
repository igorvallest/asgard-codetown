// Telas de Asgard: todo monitor é um pergaminho mágico com runas. Apagado ('off') é o pergaminho sem brilho;
// ligado sem uso pulsa fraco; o trabalho acende runas de cores diferentes; 'alert' arde em vermelho; 'progress'
// acende as runas em sequência. 'show' (espelho de vidência) e 'game' (duelo de magias) ficam em superficies-visoes.
import type { Rect, ScreenMode } from '../api';
import {
  APAGADO,
  BRILHOS,
  PERGAMINHO,
  RUNA_COUNT,
  VELINO,
  frac,
  grade,
  h32,
  pergaminho,
  pinta,
  recorte,
  runa,
  runaAcesa,
  type Grade,
} from './superficies-pincel';
import { duelo, visao } from './superficies-visoes';

type Ctx = CanvasRenderingContext2D;

export function asgardDrawScreen(ctx: Ctx, r: Rect, mode: ScreenMode, t: number, seed: number): void {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  recorte(x, y, w, h);
  const s = seed >>> 0;
  switch (mode) {
    case 'off':
      return apagado(ctx, x, y, w, h, s);
    case 'standby':
      return selo(ctx, x, y, w, h, t, s);
    case 'idle':
      return ocioso(ctx, x, y, w, h, t, s);
    case 'code':
      return codigo(ctx, x, y, w, h, t, s);
    case 'terminal':
      return terminal(ctx, x, y, w, h, t, s);
    case 'browser':
      return iluminura(ctx, x, y, w, h, t, s);
    case 'search':
      return busca(ctx, x, y, w, h, t, s);
    case 'chat':
      return conversa(ctx, x, y, w, h, t, s);
    case 'docs':
      return manuscrito(ctx, x, y, w, h, t, s);
    case 'tasks':
      return tarefas(ctx, x, y, w, h, t, s);
    case 'alert':
      return alerta(ctx, x, y, w, h, t);
    case 'progress':
      return progresso(ctx, x, y, w, h, t, s);
    case 'show':
      return visao(ctx, x, y, w, h, t, s);
    case 'game':
      return duelo(ctx, x, y, w, h, t, s);
  }
}

/** Runa da célula (linha `line`, coluna `col`) do texto da semente `s`; -1 = espaço entre palavras. */
function runaDe(s: number, line: number, col: number): number {
  const hh = h32(s + line * 131, col);
  return (hh >>> 9) % 5 === 0 ? -1 : hh % RUNA_COUNT;
}

/** Uma linha de runas; `cor` decide a tinta de cada coluna (null = não desenha). */
function linha(ctx: Ctx, g: Grade, row: number, line: number, s: number, ate: number, cor: (col: number) => string | null): number {
  const yy = g.y + row * 5;
  let last = -1;
  for (let c = 0; c < Math.min(ate, g.cols); c++) {
    const id = runaDe(s, line, c);
    if (id < 0) continue;
    const col = cor(c);
    if (!col) continue;
    runa(ctx, id, g.x + c * 4, yy, col);
    last = c;
  }
  return last;
}

/** Auréola atrás de uma linha inteira (um fill só): as runas parecem acesas. */
function auraLinha(ctx: Ctx, g: Grade, row: number, cols: number, cor: string): void {
  if (cols <= 0) return;
  pinta(ctx, g.x - 1, g.y + row * 5 - 1, cols * 4 + 1, 6, cor);
}

function apagado(ctx: Ctx, x: number, y: number, w: number, h: number, s: number): void {
  pergaminho(ctx, x, y, w, h, APAGADO);
  const g = grade(x, y, w, h);
  for (let row = 0; row < g.rows; row++) linha(ctx, g, row, row, s, g.cols, () => APAGADO.tinta);
}

/** Ligado sem uso: um selo (vegvísir simplificado) que respira devagar no meio do pergaminho. */
function selo(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const cx = x + Math.floor((w - 1) / 2);
  const cy = y + Math.floor((h - 1) / 2);
  const fase = (Math.floor(t / 700) + (s % 3)) % 4;
  const halo = ['rgba(90,190,255,0.12)', 'rgba(90,190,255,0.22)', 'rgba(90,190,255,0.34)', 'rgba(90,190,255,0.22)'][fase];
  const tinta = ['#5a8ab0', '#3a8fd0', '#1f9be8', '#3a8fd0'][fase];
  pinta(ctx, cx - 3, cy - 3, 7, 7, halo);
  pinta(ctx, cx - 2, cy - 2, 5, 5, halo);
  pinta(ctx, cx, cy - 2, 1, 5, tinta);
  pinta(ctx, cx - 2, cy, 5, 1, tinta);
  for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]] as const) pinta(ctx, cx + dx, cy + dy, 1, 1, tinta);
  pinta(ctx, cx, cy, 1, 1, fase === 2 ? '#f2fbff' : '#cfeeff');
}

/** Descanso: runas fracas com uma auréola que pulsa devagar e uma runa acesa passeando pelo texto. */
function ocioso(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const g = grade(x, y, w, h);
  const fase = Math.floor(t / 600 + (s % 4)) % 6;
  const aura = ['rgba(90,190,255,0.06)', 'rgba(90,190,255,0.10)', 'rgba(90,190,255,0.14)', 'rgba(90,190,255,0.18)', 'rgba(90,190,255,0.14)', 'rgba(90,190,255,0.10)'][fase];
  const total = g.cols * g.rows;
  const acesa = Math.floor(t / 1300 + (s % 29)) % total;
  for (let row = 0; row < g.rows; row++) {
    auraLinha(ctx, g, row, g.cols, aura);
    linha(ctx, g, row, row, s, g.cols, (c) => (row * g.cols + c === acesa ? null : PERGAMINHO.tintaFraca));
  }
  const ar = Math.floor(acesa / g.cols);
  const ac = acesa % g.cols;
  runaAcesa(ctx, Math.max(0, runaDe(s, ar, ac)), g.x + ac * 4, g.y + ar * 5, BRILHOS[0].tinta, BRILHOS[0].halo);
}

/** Código: linhas de runas coloridas subindo; a última está sendo escrita, com a pena piscando no fim. */
function codigo(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const g = grade(x, y, w, h);
  const passo = t / 900 + (s % 50);
  const scroll = Math.floor(passo);
  const escrita = Math.min(g.cols, 1 + Math.floor(frac(passo) * (g.cols + 1)));
  for (let row = 0; row < g.rows; row++) {
    const line = scroll + row;
    const ultima = row === g.rows - 1;
    auraLinha(ctx, g, row, ultima ? escrita : g.cols, 'rgba(90,190,255,0.10)');
    const fim = linha(ctx, g, row, line, s, ultima ? escrita : g.cols, (c) => BRILHOS[h32(s + line, c + 7) % BRILHOS.length].tinta);
    if (ultima && Math.floor(t / 500) % 2 === 0) pinta(ctx, g.x + (fim + 1) * 4, g.y + row * 5, 1, 4, '#1f9be8');
  }
}

/** Terminal: velino escuro; a linha atual é inscrita runa a runa em verde, com a mais nova brilhando. */
function terminal(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, VELINO);
  const g = grade(x, y, w, h);
  // cada linha ocupa uma janela fixa de passos (O(1) mesmo com t enorme)
  const step = Math.floor(t / 260) + (s % 40);
  const slot = g.cols + 3;
  const atual = Math.floor(step / slot);
  const typed = Math.min(g.cols, step - atual * slot);
  for (let row = 0; row < g.rows; row++) {
    const n = atual - (g.rows - 1) + row;
    if (n < 0) continue;
    const agora = n === atual;
    const fim = linha(ctx, g, row, n, s, agora ? typed : g.cols, () => (agora ? '#8ef0a0' : VELINO.tinta));
    if (!agora) continue;
    if (fim >= 0) pinta(ctx, g.x + fim * 4 - 1, g.y + row * 5 - 1, 5, 6, 'rgba(120,255,160,0.30)');
    if (Math.floor(t / 450) % 2 === 0) pinta(ctx, g.x + (fim + 1) * 4, g.y + row * 5, 1, 4, '#d6ffe0');
  }
}

/** Navegador: página iluminada com faixa de ouro no topo, iluminuras (céu, montanha, campo) e linhas de texto. */
function iluminura(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  pinta(ctx, x + 1, y, w - 2, 2, '#c99a3a');
  pinta(ctx, x + 1, y, w - 2, 1, '#f0cf72');
  pinta(ctx, x + 2, y, 1, 2, '#b8342a');
  const off = Math.floor(t / 1100 + (s % 9)) % 7;
  const left = x + 2;
  const inner = Math.max(1, w - 4);
  const pic = Math.max(2, Math.floor(inner * 0.42));
  for (let i = 0; i < h - 3; i++) {
    const row = i + off;
    const yy = y + 3 + i;
    const k = row % 7;
    if (k <= 2) {
      // iluminura: céu, montanha nevada e campo
      pinta(ctx, left, yy, pic, 1, k === 0 ? '#86b8dc' : k === 1 ? '#9aa8b4' : '#6c9a52');
      if (k === 1) pinta(ctx, left + Math.floor(pic / 2) - 1, yy, 2, 1, '#eef3f7');
      pinta(ctx, left + pic + 1, yy, Math.max(1, inner - pic - 1 - (h32(s, row) % 3)), 1, k === 1 ? PERGAMINHO.tinta : PERGAMINHO.tintaFraca);
    } else if (k !== 4) {
      pinta(ctx, left, yy, Math.max(1, inner - (h32(s, row) % 5)), 1, k === 3 ? '#9a2a20' : PERGAMINHO.tintaFraca);
    }
  }
}

/** Busca: uma lente de vidência de moldura dourada passeia pelas runas; a que está sob a lente se acende. */
function busca(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const g = grade(x, y, w, h);
  const total = g.cols * g.rows;
  const alvo = Math.floor(t / 700 + (s % 5)) % total;
  const ar = Math.floor(alvo / g.cols);
  const ac = alvo % g.cols;
  for (let row = 0; row < g.rows; row++) linha(ctx, g, row, row + (s % 7), s, g.cols, (c) => (row === ar && c === ac ? null : PERGAMINHO.tinta));
  const lx = g.x + ac * 4 - 1;
  const ly = g.y + ar * 5 - 1;
  pinta(ctx, lx, ly, 5, 6, 'rgba(200,240,255,0.55)');
  runa(ctx, Math.max(0, runaDe(s, ar + (s % 7), ac)), lx + 1, ly + 1, '#1f7fc4');
  pinta(ctx, lx, ly - 1, 5, 1, '#c99a3a');
  pinta(ctx, lx, ly + 6, 5, 1, '#a87d2c');
  pinta(ctx, lx - 1, ly, 1, 6, '#c99a3a');
  pinta(ctx, lx + 5, ly, 1, 6, '#a87d2c');
  pinta(ctx, lx + 5, ly + 6, 2, 1, '#6b4a2a');
}

/** Conversa: fitas de runas alternando à esquerda (âmbar, os outros) e à direita (azul, eu), subindo. */
function conversa(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const g = grade(x, y, w, h);
  const step = Math.floor(t / 1100 + (s % 13));
  for (let row = 0; row < g.rows; row++) {
    const n = step + row;
    const hh = h32(s, n);
    const meu = (hh & 1) === 1;
    const len = 1 + ((hh >>> 2) % Math.max(1, g.cols - 1));
    const c0 = meu ? g.cols - len : 0;
    const b = meu ? BRILHOS[0] : BRILHOS[1];
    pinta(ctx, g.x + c0 * 4 - 1, g.y + row * 5 - 1, len * 4 + 1, 6, b.halo);
    for (let c = c0; c < c0 + len; c++) runa(ctx, h32(s + n, c) % RUNA_COUNT, g.x + c * 4, g.y + row * 5, b.tinta);
  }
  // "digitando": três pontinhos no rodapé, quando sobra espaço
  const livre = y + h - 1 > g.y + g.h;
  if (livre) {
    const dot = Math.floor(t / 250) % 3;
    for (let k = 0; k < 3; k++) pinta(ctx, g.x + k * 2, y + h - 1, 1, 1, k === dot ? '#1f7fc4' : PERGAMINHO.tintaFraca);
  }
}

/** Documento: manuscrito com capitular dourada e linhas finas de texto rolando devagar. */
function manuscrito(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const off = Math.floor(t / 1500 + (s % 7)) % 3;
  const left = x + 2;
  const inner = Math.max(1, w - 4);
  const cap = h >= 7 && w >= 10;
  if (cap) {
    pinta(ctx, left, y + 1, 5, 6, '#c99a3a');
    pinta(ctx, left, y + 1, 5, 1, '#f0cf72');
    runa(ctx, s % RUNA_COUNT, left + 1, y + 2, '#9a2a20');
  }
  for (let i = 0; i < h - 1; i++) {
    const row = i + off;
    const yy = y + 1 + i;
    if (row % 2 === 1) continue;
    const beside = cap && yy <= y + 6;
    const lx = beside ? left + 6 : left;
    const lw = Math.max(1, (beside ? inner - 6 : inner) - (h32(s, row) % 4));
    pinta(ctx, lx, yy, lw, 1, row % 6 === 0 ? PERGAMINHO.tinta : PERGAMINHO.tintaFraca);
  }
}

/** Tarefas: caixinhas que vão ganhando a runa verde de feito, uma a uma. */
function tarefas(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const rows = Math.max(1, Math.floor((h - 1) / 4));
  const done = Math.floor(t / 900 + (s % 6)) % (rows + 2);
  const bx = x + 2;
  for (let i = 0; i < rows; i++) {
    const yy = y + 1 + i * 4;
    const ok = i < done;
    const ink = ok ? '#23884a' : PERGAMINHO.tinta;
    if (ok) pinta(ctx, bx - 1, yy - 1, 5, 5, 'rgba(80,220,130,0.30)');
    pinta(ctx, bx, yy, 3, 1, ink);
    pinta(ctx, bx, yy + 2, 3, 1, ink);
    pinta(ctx, bx, yy + 1, 1, 1, ink);
    pinta(ctx, bx + 2, yy + 1, 1, 1, ink);
    if (ok) pinta(ctx, bx + 1, yy + 1, 1, 1, '#7cf09a');
    pinta(ctx, bx + 5, yy + 1, Math.max(1, w - 8 - ((s + i) % 3)), 1, ok ? '#a99868' : PERGAMINHO.tinta);
  }
}

/** Alerta: o pergaminho arde em vermelho, piscando, com a runa de atenção ("!") no meio. */
function alerta(ctx: Ctx, x: number, y: number, w: number, h: number, t: number): void {
  const on = Math.floor(t / 380) % 2 === 0;
  pinta(ctx, x, y, w, h, on ? '#d8432f' : '#7e2216');
  pinta(ctx, x, y, w, 1, on ? '#f07a5a' : '#9a3020');
  pinta(ctx, x, y + h - 1, w, 1, on ? '#a8301f' : '#5e180e');
  pinta(ctx, x, y, 1, h, '#5a1810');
  pinta(ctx, x + w - 1, y, 1, h, '#5a1810');
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const tinta = on ? '#ffe6c8' : '#ff8a6a';
  pinta(ctx, cx - 2, cy - 4, 5, 8, on ? 'rgba(255,220,180,0.35)' : 'rgba(255,90,60,0.25)');
  pinta(ctx, cx, cy - 3, 1, 4, tinta);
  pinta(ctx, cx, cy + 2, 1, 1, tinta);
  if (w >= 14 && h >= 7) {
    // naudiz, a runa da necessidade, dos dois lados
    runa(ctx, 8, x + 2, cy - 2, tinta);
    runa(ctx, 8, x + w - 5, cy - 2, tinta);
  }
}

/** Progresso: as runas acendem uma a uma, em ordem; cheias, piscam juntas e o ciclo recomeça. */
function progresso(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pergaminho(ctx, x, y, w, h, PERGAMINHO);
  const g = grade(x, y, w, h);
  const total = g.cols * g.rows;
  const period = 3400 + (s % 5) * 300;
  const p = frac((t + (s % 997) * 37) / period);
  const acesas = p < 0.85 ? Math.floor((p / 0.85) * (total + 1)) : total;
  const cheio = p >= 0.85;
  const pisca = cheio && Math.floor(t / 160) % 2 === 0;
  for (let row = 0; row < g.rows; row++) {
    const naLinha = Math.max(0, Math.min(g.cols, acesas - row * g.cols));
    auraLinha(ctx, g, row, naLinha, pisca ? 'rgba(255,230,150,0.55)' : 'rgba(255,190,70,0.30)');
    for (let c = 0; c < g.cols; c++) {
      const k = row * g.cols + c;
      const nova = !cheio && k === acesas - 1;
      const cor = k >= acesas ? PERGAMINHO.tintaFraca : pisca ? '#fff4c8' : nova ? '#1f9be8' : '#c47a0c';
      runa(ctx, h32(s, k) % RUNA_COUNT, g.x + c * 4, g.y + row * 5, cor);
    }
  }
}
