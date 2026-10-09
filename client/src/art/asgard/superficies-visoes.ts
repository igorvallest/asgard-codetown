// Telas de lazer de Asgard: o espelho de vidência ('show', TV do salão) e o duelo de magias ('game', TV e fliperama).
// A visão é fixa pela semente, como os programas do Escritório: 0 knattleikr (jogo de bola no gelo, no mesmo compasso
// de footballLance, então a torcida comemora junto), 1 saga (romance à luz da fogueira), 2 Sleipnir na Bifrost.
import { footballLance } from '../dynamic';
import { RUNA_TIWAZ, estandarte, frac, h32, pinta } from './superficies-pincel';

type Ctx = CanvasRenderingContext2D;

export function visao(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  const prog = s % 3;
  if (prog === 0) knattleikr(ctx, x, y, w, h, t, s);
  else if (prog === 1) saga(ctx, x, y, w, h, t, s);
  else sleipnir(ctx, x, y, w, h, t, s);
  espelho(ctx, x, y, w, h, t, s);
}

/** Vidro do espelho por cima da visão: tom azulado, névoa passando e cantos arredondados. */
function espelho(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pinta(ctx, x, y, w, h, 'rgba(110,130,255,0.10)');
  for (let k = 0; k < 2; k++) {
    const my = y + 1 + Math.floor(((k * 2 + 1) * h) / 4);
    const mx = x - 8 + Math.floor(frac(t / (6000 + k * 2500) + ((s % 10) + k * 5) / 10) * (w + 16));
    pinta(ctx, mx, my, 8, 1, 'rgba(200,215,255,0.20)');
    pinta(ctx, mx + 2, my - 1, 4, 1, 'rgba(200,215,255,0.14)');
  }
  const c = 'rgba(10,10,24,0.65)';
  pinta(ctx, x, y, 2, 1, c);
  pinta(ctx, x, y + 1, 1, 1, c);
  pinta(ctx, x + w - 2, y, 2, 1, c);
  pinta(ctx, x + w - 1, y + 1, 1, 1, c);
  pinta(ctx, x, y + h - 1, 2, 1, c);
  pinta(ctx, x, y + h - 2, 1, 1, c);
  pinta(ctx, x + w - 2, y + h - 1, 2, 1, c);
  pinta(ctx, x + w - 1, y + h - 2, 1, 1, c);
}

/** Knattleikr: campo de gelo, traves douradas, dois times e a bola; no fim do lance a bola entra e a runa da vitória pisca. */
function knattleikr(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  const { lance: k, progress: p, right, goalAt } = footballLance(t, s);
  pinta(ctx, x, y, w, h, '#9cc4d8');
  for (let i = 0; i * 4 < w; i += 2) pinta(ctx, x + i * 4, y, 4, h, '#a9cfe0');
  const mx = x + Math.floor(w / 2);
  const my = y + Math.floor(h / 2);
  pinta(ctx, mx, y, 1, h, '#e8f6ff');
  if (h >= 9) {
    pinta(ctx, mx - 2, my - 1, 1, 3, '#e8f6ff');
    pinta(ctx, mx + 2, my - 1, 1, 3, '#e8f6ff');
    pinta(ctx, mx - 1, my - 2, 3, 1, '#e8f6ff');
    pinta(ctx, mx - 1, my + 2, 3, 1, '#e8f6ff');
  }
  const gh = Math.max(3, Math.floor(h / 3));
  pinta(ctx, x, my - Math.floor(gh / 2), 1, gh, '#e0b44a');
  pinta(ctx, x + w - 1, my - Math.floor(gh / 2), 1, gh, '#e0b44a');
  // a bola sai do meio e termina dentro de um dos gols
  const u = Math.min(1, p / goalAt);
  const ease = u * u * (3 - 2 * u);
  const bx = mx + Math.round((right ? 1 : -1) * (Math.floor(w / 2) - 1) * ease);
  const by = my + Math.round(Math.sin(u * Math.PI * 3 + (s % 7)) * Math.max(1, (h - 6) / 3) * (1 - ease));
  for (let i = 0; i < 6; i++) {
    const red = i < 3;
    const hh = h32(s + i * 31, 7);
    const baseX = mx + (red ? -1 : 1) * Math.floor((w / 2) * (0.25 + (i % 3) * 0.22));
    const baseY = y + 2 + Math.floor(((i % 3) + 0.5) * ((h - 4) / 3));
    const pull = 0.35 + (hh % 5) * 0.08;
    const jx = Math.round(Math.sin(t / (420 + (hh % 300)) + i) * 1.2);
    pinta(ctx, Math.round(baseX + (bx - baseX) * pull) + jx, Math.round(baseY + (by - baseY) * pull * 0.6) - 1, 1, 2, red ? '#c8402e' : '#2f5fb8');
  }
  pinta(ctx, bx, by + 1, 1, 1, 'rgba(20,40,60,0.45)');
  pinta(ctx, bx, by, 1, 1, '#3a2a1e');
  if (w >= 16 && h >= 9) {
    const goals = [0, 0];
    for (let j = k - (k % 4); j < k; j++) goals[h32(s, j) & 1]++;
    pinta(ctx, x + 1, y + 1, 11, 3, 'rgba(12,16,28,0.8)');
    pinta(ctx, x + 2, y + 2, 1, 1, '#c8402e');
    for (let g = 0; g < goals[0]; g++) pinta(ctx, x + 4 + g, y + 2, 1, 1, '#f2e3b8');
    pinta(ctx, x + 9, y + 2, 1, 1, '#2f5fb8');
    for (let g = 0; g < goals[1]; g++) pinta(ctx, x + 7 - g, y + 2, 1, 1, '#9fc4ff');
  }
  if (p >= goalAt) {
    const c = Math.floor(t / 180) % 2 === 0 ? '#ffd84d' : '#ffffff';
    pinta(ctx, x, y, w, 1, c);
    pinta(ctx, x, y + h - 1, w, 1, c);
    pinta(ctx, x, y, 1, h, c);
    pinta(ctx, x + w - 1, y, 1, h, c);
    if (w >= 15 && h >= 9) estandarte(ctx, x, y, w, h, RUNA_TIWAZ, c);
  }
}

/** Rosto em close: escudeira de tranças louras ou guerreiro de elmo e barba; `olhar` 0 = para a direita. */
function rosto(ctx: Ctx, cx: number, cy: number, sc: number, pele: string, cabelo: string, guerreiro: boolean, olhar: number): void {
  const fw = 6 * sc;
  const fh = 7 * sc;
  const fx = cx - Math.floor(fw / 2);
  const fy = cy - Math.floor(fh / 2);
  if (!guerreiro) {
    pinta(ctx, fx - sc, fy, fw + 2 * sc, fh + sc, cabelo);
    pinta(ctx, fx - sc, fy + fh + sc, sc, sc, cabelo);
  }
  pinta(ctx, fx, fy + sc, fw, fh - sc, pele);
  pinta(ctx, fx + sc, fy + fh, fw - 2 * sc, sc, pele);
  const ex = olhar === 0 ? sc : 0;
  if (guerreiro) {
    pinta(ctx, fx, fy - sc, fw, 2 * sc, '#8a8f99');
    pinta(ctx, fx, fy - sc, fw, 1, '#b3b8c2');
    pinta(ctx, fx + 2 * sc, fy + sc, sc, 2 * sc, '#6d727c');
    pinta(ctx, fx, fy + 5 * sc, fw, 2 * sc, cabelo);
    pinta(ctx, fx + sc, fy + fh, fw - 2 * sc, sc, cabelo);
  } else {
    pinta(ctx, fx, fy - sc, fw, 2 * sc, cabelo);
  }
  pinta(ctx, fx + sc + ex, fy + 3 * sc, sc, sc, '#2b2236');
  pinta(ctx, fx + 3 * sc + ex, fy + 3 * sc, sc, sc, '#2b2236');
  if (!guerreiro) pinta(ctx, fx + 2 * sc + ex, fy + 5 * sc, sc, Math.max(1, Math.floor(sc / 2)), '#b4475a');
}

/** Saga: salão à luz da fogueira, cortes entre os dois em close e o casal com fagulhas douradas subindo. */
function saga(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  const shot = Math.floor((t + (s % 97) * 31) / 2600) % 4;
  const chao = Math.max(2, Math.floor(h / 5));
  pinta(ctx, x, y, w, h, '#6a3a2a');
  pinta(ctx, x, y + h - chao, w, chao, '#3e2219');
  const fl = Math.floor(t / 140) % 3;
  const fx = x + w - Math.max(4, Math.floor(w / 4));
  pinta(ctx, fx - 1, y + h - chao - 2, 5, 2, 'rgba(255,170,80,0.35)');
  pinta(ctx, fx, y + h - chao - 2, 3, 2, ['#f2a03d', '#ffcf5a', '#e8743a'][fl]);
  pinta(ctx, fx + 1, y + h - chao - 3 - (fl & 1), 1, 1, '#ffe08a');
  const sc = h >= 13 ? 2 : 1;
  const my = y + Math.floor(h / 2) + (sc > 1 ? 1 : 0);
  if (shot === 0) rosto(ctx, x + Math.floor(w / 2), my, sc, '#f2c3a0', '#e8c86a', false, 0);
  else if (shot === 1) rosto(ctx, x + Math.floor(w / 2), my, sc, '#c98f68', '#8a4a2a', true, 1);
  else {
    const s1 = w >= 34 ? sc : 1;
    rosto(ctx, x + Math.floor(w * 0.3), my, s1, '#f2c3a0', '#e8c86a', false, 0);
    rosto(ctx, x + Math.floor(w * 0.7), my, s1, '#c98f68', '#8a4a2a', true, 1);
    if (shot === 3) {
      for (let i = 0; i < 3; i++) {
        const life = frac((t + i * 470) / 1400);
        pinta(ctx, x + Math.floor(w / 2) - 1 + i, y + h - 3 - Math.floor(life * (h - 2)), 1, 1, i === 1 ? '#fff2b0' : '#ffd84d');
      }
    }
  }
}

/** Sleipnir, o cavalo de oito patas, galopando com Odin sobre a Bifrost, com montanhas nevadas e nuvens ao fundo. */
function sleipnir(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  pinta(ctx, x, y, w, h, '#7fa8e8');
  pinta(ctx, x, y, w, Math.floor(h / 3), '#5f88d4');
  const ponte = y + h - Math.max(4, Math.floor(h / 3));
  for (let m = 0; m < 2; m++) {
    const mx = x + Math.floor(((m * 2 + 1) * w) / 4) + ((s >>> (m * 3)) % 3) - 1;
    const topo = ponte - 6;
    for (let k = 0; k < 3; k++) pinta(ctx, mx - 2 * k, topo + 2 * k, 1 + 4 * k, 2, k === 0 ? '#eef3f8' : '#8d9ab0');
  }
  for (let i = 0; i < 2; i++) {
    const cx = x + w - 1 - Math.floor(frac(t / (9000 + i * 4000) + i * 0.5 + (s % 5) * 0.1) * (w + 8));
    const cy = y + 1 + i * 3;
    pinta(ctx, cx, cy + 1, 5, 2, '#ffffff');
    pinta(ctx, cx + 1, cy, 3, 1, '#ffffff');
  }
  // a ponte de arco-íris e o abismo embaixo
  const cores = ['#e8454a', '#f2c14e', '#4cae6a', '#3d7ce0'];
  cores.forEach((c, i) => pinta(ctx, x, ponte + i, w, 1, c));
  pinta(ctx, x, ponte + 4, w, h, '#2a2f55');
  // Sleipnir e Odin
  const run = frac(t / 5200 + (s % 11) * 0.09);
  const px = x + Math.floor(run * (w + 10)) - 6;
  const gal = Math.floor(t / 120) % 2;
  const hy = ponte - 4 - gal;
  pinta(ctx, px - 3, hy + 1, 1, 1, 'rgba(255,242,176,0.6)');
  pinta(ctx, px - 1, hy + 2, 1, 1, '#fff2b0');
  pinta(ctx, px, hy, 5, 2, '#eef0f4');
  pinta(ctx, px + 5, hy - 2, 2, 2, '#eef0f4');
  pinta(ctx, px + 4, hy - 1, 1, 1, '#c9ced8');
  pinta(ctx, px + 6, hy - 2, 1, 1, '#2b2236');
  for (const lx of gal ? [0, 2, 4] : [0, 1, 3, 4]) pinta(ctx, px + lx, hy + 2, 1, 2 + gal, '#c9ced8');
  pinta(ctx, px + 1, hy - 3, 2, 3, '#3d4f8a');
  pinta(ctx, px + 1, hy - 4, 2, 1, '#f2c3a0');
  pinta(ctx, px + 4, hy - 6, 1, 5, '#c9a24a');
}

/**
 * Duelo de magias: dois magos trocando feitiços (fogo contra gelo sob a aurora ou raio contra veneno na caverna),
 * barras de vida no topo diminuindo e, quando uma acaba, o vencido cai e a runa da vitória pisca; o duelo recomeça.
 */
export function duelo(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, s: number): void {
  const ROUND = 9000;
  const tt = t + (s % 991) * 17;
  const k = Math.floor(tt / ROUND);
  const p = frac(tt / ROUND);
  const gelo = s % 2 === 0;
  pinta(ctx, x, y, w, h, gelo ? '#1d2244' : '#3a2420');
  if (gelo) {
    pinta(ctx, x, y + 4, w, 1, 'rgba(90,255,170,0.35)');
    pinta(ctx, x + Math.floor(w / 3), y + 5, Math.floor(w / 2), 1, 'rgba(170,110,255,0.30)');
  } else {
    for (let i = 0; i < 4; i++) pinta(ctx, x + 2 + ((h32(s, i) % Math.max(1, w - 4)) | 0), y, 1, 1 + (i % 2), '#5a3a30');
  }
  const chaoH = Math.max(2, Math.floor(h / 4));
  const ground = y + h - chaoH;
  pinta(ctx, x, ground, w, chaoH, gelo ? '#dfe8f0' : '#6b5a4c');
  pinta(ctx, x, ground, w, 1, gelo ? '#ffffff' : '#8a7462');
  const loser = h32(s, k) & 1;
  const bw = Math.max(3, Math.floor(w / 2) - 2);
  const luta = Math.min(1, p / 0.82);
  const vida = (who: number) => Math.max(0, 1 - luta * (who === loser ? 1 : 0.55));
  for (let who = 0; who < 2; who++) {
    const bx = who === 0 ? x + 1 : x + w - 1 - bw;
    pinta(ctx, bx, y + 1, bw, 2, '#3a1a22');
    const lw = Math.round(bw * vida(who));
    if (lw > 0) pinta(ctx, who === 0 ? bx : bx + bw - lw, y + 1, lw, 2, vida(who) > 0.35 ? '#ffd84d' : '#ff6b4a');
  }
  const ko = p >= 0.82;
  const cast = h32(s, Math.floor(tt / 600)) % 3;
  const q = frac(tt / 600);
  const feitico = (who: number) => (who === 0 ? (gelo ? '#ff8a3a' : '#ffe14d') : gelo ? '#8fe8ff' : '#7cf05a');
  for (let who = 0; who < 2; who++) {
    const robe = who === 0 ? (gelo ? '#c8402e' : '#d8a02a') : gelo ? '#3d8fe0' : '#4c9f50';
    const fx = who === 0 ? x + 2 : x + w - 5;
    if (ko && who === loser) {
      pinta(ctx, fx - 1, ground - 2, 4, 2, robe);
      pinta(ctx, who === 0 ? fx - 3 : fx + 3, ground - 2, 2, 2, '#f2c3a0');
      continue;
    }
    const hit = !ko && cast === 1 - who && q > 0.8;
    const bob = Math.floor(tt / 260 + who) % 2;
    pinta(ctx, fx + 1, ground - 10 + bob, 1, 1, robe);
    pinta(ctx, fx, ground - 9 + bob, 3, 1, robe);
    pinta(ctx, fx, ground - 8 + bob, 3, 2, hit ? '#ffffff' : '#f2c3a0');
    pinta(ctx, fx, ground - 6 + bob, 3, 4 - bob, hit ? '#ffffff' : robe);
    pinta(ctx, fx, ground - 2, 3, 2, '#2b2530');
    const sx = who === 0 ? fx + 3 : fx - 1;
    pinta(ctx, sx, ground - 9 + bob, 1, 8, '#8a6a3a');
    pinta(ctx, sx, ground - 10 + bob, 1, 1, feitico(who));
  }
  if (!ko && cast < 2) {
    const from = cast === 0 ? x + 6 : x + w - 7;
    const to = cast === 0 ? x + w - 6 : x + 5;
    const fy = ground - 6;
    if (q < 0.8) {
      const bx = Math.round(from + (to - from) * (q / 0.8));
      pinta(ctx, cast === 0 ? bx - 2 : bx + 2, fy, 2, 1, 'rgba(255,255,255,0.35)');
      pinta(ctx, bx, fy - 1, 2, 3, feitico(cast));
      pinta(ctx, bx, fy, 2, 1, '#ffffff');
    } else {
      pinta(ctx, to - 1, fy - 2, 4, 5, 'rgba(255,255,255,0.5)');
    }
  }
  if (ko && Math.floor(tt / 200) % 2 === 0 && w >= 12 && h >= 9) estandarte(ctx, x, y, w, h, RUNA_TIWAZ, '#ffd84d');
}
