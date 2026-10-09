// Janela, relógio e quadro de runas de Asgard (desenhos por quadro, mesmas regras do pincel).
import type { Rect } from '../api';
import { mix } from '../core/color';
import { RUNA_COUNT, frac, h32, pinta, recorte } from './superficies-pincel';

type Ctx = CanvasRenderingContext2D;

// ------------------------------------------------------------------ janela: Asgard pela hora do dia

/** Céu ao longo do dia: [hora, topo, horizonte]. Noites longas e crepúsculos demorados, como no norte. */
const CEU: readonly (readonly [number, string, string])[] = [
  [0, '#070c22', '#15204a'],
  [4.6, '#0a1230', '#1d2a58'],
  [5.6, '#2e3270', '#d98a78'],
  [6.6, '#5b8fd0', '#f2c4a0'],
  [8, '#5f9fdc', '#cfe6f5'],
  [16, '#5a98d8', '#d6ebf7'],
  [17.4, '#4f74bc', '#f2ad80'],
  [18.4, '#3d4290', '#e8836a'],
  [19.4, '#1f2358', '#6e4a86'],
  [20.4, '#0c1438', '#22305e'],
  [24, '#070c22', '#15204a'],
];

function ceuEm(hour: number): { top: string; bottom: string; night: number; day: number; hr: number } {
  const hr = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < CEU.length - 2 && CEU[i + 1][0] <= hr) i++;
  const [h0, t0, b0] = CEU[i];
  const [h1, t1, b1] = CEU[i + 1];
  const u = (hr - h0) / Math.max(0.001, h1 - h0);
  const night = hr < 5 || hr > 20 ? 1 : hr < 6.2 ? Math.max(0, (6.2 - hr) / 1.2) : hr > 19 ? Math.min(1, (hr - 19) / 1.2) : 0;
  const day = hr > 7 && hr < 17 ? 1 : hr >= 6 && hr <= 7 ? hr - 6 : hr >= 17 && hr <= 18.5 ? (18.5 - hr) / 1.5 : 0;
  return { top: mix(t0, t1, u), bottom: mix(b0, b1, u), night, day, hr };
}

/** Serra: ruído 1D com interpolação linear (picos em bico), altura em px a partir do chão. */
function serra(i: number, s: number, passo: number, base: number, amp: number): number {
  const k = Math.floor(i / passo);
  const f = i / passo - k;
  const a = (h32(s, k) % 1000) / 1000;
  const b = (h32(s, k + 1) % 1000) / 1000;
  return base + (a + (b - a) * f) * amp;
}

export function asgardDrawWindowView(ctx: Ctx, r: Rect, hour: number, t: number, seed: number): void {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  recorte(x, y, w, h);
  const s = seed >>> 0;
  const sky = ceuEm(hour);
  for (let i = 0; i < h; i++) pinta(ctx, x, y + i, w, 1, mix(sky.top, sky.bottom, i / Math.max(1, h - 1)));
  if (sky.night > 0.3) {
    for (let k = 0; k < 8; k++) {
      const hh = h32(s, k + 101);
      const tw = Math.floor(t / 600 + k) % 5 === 0;
      pinta(ctx, x + (hh % w), y + ((hh >>> 8) % Math.max(1, Math.floor(h * 0.5))), 1, 1, tw ? '#8090c0' : '#f2f4ff');
    }
  }
  // aurora boreal: uma fita verde ondulando devagar, com a franja violeta embaixo
  if (sky.night > 0.35) {
    const a = Math.min(1, (sky.night - 0.35) / 0.4);
    const fase = Math.floor(t / 900) % 4;
    const alfa = [0.22, 0.28, 0.34, 0.28][fase] * a;
    const verde = `rgba(90,255,170,${alfa.toFixed(2)})`;
    const violeta = `rgba(170,110,255,${(alfa * 0.7).toFixed(2)})`;
    for (let i = 0; i < w; i++) {
      const v = Math.sin(i * 0.3 + t / 1400 + (s % 7));
      const alto = 1 + Math.round((Math.sin(i * 0.21 - t / 2100) + 1) * 1.2);
      const ay = y + 3 + Math.round(v * 1.5);
      pinta(ctx, x + i, ay, 1, alto, verde);
      if ((i + (s % 3)) % 3 !== 0) pinta(ctx, x + i, ay + alto, 1, 1, violeta);
    }
  }
  if (sky.night > 0.3) {
    const mx = x + Math.floor(w * 0.74);
    pinta(ctx, mx, y + 2, 3, 3, '#f4efd2');
    pinta(ctx, mx + 2, y + 2, 1, 1, sky.top);
    pinta(ctx, mx, y + 4, 1, 1, '#d9d2ad');
  }
  // sol baixo do norte
  if (sky.hr > 5.6 && sky.hr < 19) {
    const p = (sky.hr - 5.6) / 13.4;
    const sx = x + Math.floor(p * (w - 3));
    const sy = y + Math.floor((1 - Math.sin(p * Math.PI) * 0.7) * (h * 0.5)) + 1;
    const warm = sky.day < 0.7;
    pinta(ctx, sx - 1, sy, 5, 3, warm ? 'rgba(255,190,120,0.35)' : 'rgba(255,250,210,0.35)');
    pinta(ctx, sx, sy, 3, 3, warm ? '#ffcf86' : '#fff6c8');
  }
  if (sky.night < 0.8) {
    const nuvem = sky.day > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,214,190,0.7)';
    for (let k = 0; k < 2; k++) {
      const hh = h32(s, k + 7);
      const span = w + 12;
      const cx = x - 6 + Math.floor(frac(((t / 1000) * (0.3 + k * 0.2)) / span + (hh % 100) / 100) * span);
      const cy = y + 2 + k * 3 + ((hh >>> 4) % 2);
      const cw = 5 + (hh % 3);
      pinta(ctx, cx, cy + 1, cw, 1, nuvem);
      pinta(ctx, cx + 1, cy, cw - 2, 1, nuvem);
    }
  }
  // montanhas nevadas: serra do fundo (clara) e da frente (escura), neve nos picos
  const escuro = Math.max(sky.night, 1 - sky.day) * 0.9;
  const fundo = mix('#a3b5c9', '#1b2342', escuro);
  const frente = mix('#5d6f80', '#10172c', escuro);
  const crepusculo = sky.night < 0.6 && sky.day < 0.6;
  const neve = sky.night > 0.6 ? '#8d9cc0' : crepusculo ? mix('#f4f7fb', '#f6b08a', 0.45) : '#f2f6fa';
  const neveFrente = mix(neve, frente, 0.25);
  const linhaNeve = h * 0.45;
  for (let i = 0; i < w; i++) {
    const hf = Math.round(serra(i + (s % 97), s + 11, 6, h * 0.2, h * 0.5));
    pinta(ctx, x + i, y + h - hf, 1, hf, fundo);
    if (hf > linhaNeve) pinta(ctx, x + i, y + h - hf, 1, Math.max(1, Math.round((hf - linhaNeve) * 0.6)), neve);
  }
  for (let i = 0; i < w; i++) {
    const hn = Math.round(serra(i + (s % 53), s + 23, 4, h * 0.08, h * 0.3));
    pinta(ctx, x + i, y + h - hn, 1, hn, frente);
    if (hn > h * 0.27) pinta(ctx, x + i, y + h - hn, 1, 1, neveFrente);
  }
  // salão de Asgard no vale: telhado de ouro em bico e a porta acesa à noite
  if (w >= 12) {
    const hx = x + 1 + ((s * 7) % Math.max(1, w - 6));
    const base = y + h - 1;
    const ouro = mix('#e0b04a', '#7a5a22', escuro);
    pinta(ctx, hx + 2, base - 3, 1, 1, ouro);
    pinta(ctx, hx + 1, base - 2, 3, 1, ouro);
    pinta(ctx, hx, base - 1, 5, 1, mix(ouro, '#5a3a20', 0.3));
    pinta(ctx, hx + 1, base, 3, 1, mix('#5a3d28', '#1c1622', escuro));
    if (sky.night > 0.2) pinta(ctx, hx + 2, base, 1, 1, Math.floor(t / 2500) % 7 === 0 ? '#c99a40' : '#ffd36b');
  }
}

// ------------------------------------------------------------------ relógio: disco de sol e lua

/** Disco do céu (metade de cima céu, de baixo terra) com o sol ou a lua girando pelas 24 h, e ponteiros de ouro. */
export function asgardDrawClock(ctx: Ctx, r: Rect, date: Date): void {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  recorte(x, y, w, h);
  const size = Math.min(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const R = size / 2;
  const hora = date.getHours() + date.getMinutes() / 60;
  const dia = hora >= 6 && hora < 18;
  const ceu = dia ? '#6fa8dc' : '#1c2452';
  const terra = dia ? '#3f5a4a' : '#141a30';
  const y0 = Math.round(cy - R);
  for (let yy = 0; yy < size; yy++) {
    const dy = yy + 0.5 - R;
    const fora = Math.sqrt(Math.max(0, R * R - dy * dy));
    const dentro = Math.sqrt(Math.max(0, (R - 1) * (R - 1) - dy * dy));
    const fx0 = Math.round(cx - fora);
    const fx1 = Math.round(cx + fora);
    if (fx1 <= fx0) continue;
    pinta(ctx, fx0, y0 + yy, fx1 - fx0, 1, yy === 0 ? '#f0cf72' : '#c99a3a');
    const ix0 = Math.round(cx - dentro);
    const ix1 = Math.round(cx + dentro);
    if (ix1 > ix0) pinta(ctx, ix0, y0 + yy, ix1 - ix0, 1, dy < 0 ? ceu : dy < 1 ? '#c99a3a' : terra);
  }
  // sol e lua em lados opostos do disco: meio-dia com o sol no alto, meia-noite com a lua
  const a = ((hora - 12) / 24) * Math.PI * 2;
  const rr = R * 0.5;
  const astro = (ang: number, sol: boolean) => {
    const ax = Math.round(cx + Math.sin(ang) * rr - 1);
    const ay = Math.round(cy - Math.cos(ang) * rr - 1);
    if (ay + 1 > cy) return;
    pinta(ctx, ax, ay, 2, 2, sol ? '#ffd75a' : '#e8ecf8');
    pinta(ctx, ax, ay, 1, 1, sol ? '#fff3b0' : '#c9d0e4');
  };
  astro(a, true);
  astro(a + Math.PI, false);
  const ponteiro = (angle: number, len: number, color: string) => {
    const ang = angle - Math.PI / 2;
    const steps = Math.ceil(len * 2);
    let lx = -999;
    let ly = -999;
    for (let i = 1; i <= steps; i++) {
      const d = (len * i) / steps;
      const px = Math.floor(cx + Math.cos(ang) * d);
      const py = Math.floor(cy + Math.sin(ang) * d);
      if (px === lx && py === ly) continue;
      pinta(ctx, px, py, 1, 1, color);
      lx = px;
      ly = py;
    }
  };
  const min = date.getMinutes() + date.getSeconds() / 60;
  const hr12 = (date.getHours() % 12) + min / 60;
  ponteiro((hr12 / 12) * Math.PI * 2, size * 0.26, '#f0cf72');
  ponteiro((min / 60) * Math.PI * 2, size * 0.4, '#f2ead6');
  pinta(ctx, Math.floor(cx), Math.floor(cy), 1, 1, '#a8281e');
}

// ------------------------------------------------------------------ quadro de runas

const MARCA = { pending: '#a0a6ae', in_progress: '#4fb8e8', completed: '#e0b040' } as const;

/**
 * Quadro de runas: três colunas (a fazer / fazendo / feito) separadas por entalhes, cada tarefa uma pedra rúnica:
 * cinza com a runa entalhada, brilhando em azul enquanto se faz e dourada quando feita.
 */
export function asgardDrawBoard(ctx: Ctx, r: Rect, items: readonly { status: 'pending' | 'in_progress' | 'completed' }[], t: number): void {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  if (w <= 0 || h <= 0) return;
  recorte(x, y, w, h);
  const colW = Math.floor(w / 3);
  const order = ['pending', 'in_progress', 'completed'] as const;
  for (let c = 0; c < 3; c++) {
    pinta(ctx, x + c * colW + 1, y, colW - 2, 1, MARCA[order[c]]);
    if (c > 0) {
      pinta(ctx, x + c * colW - 1, y + 2, 1, h - 3, '#3a2a1e');
      pinta(ctx, x + c * colW, y + 2, 1, h - 3, 'rgba(255,230,190,0.25)');
    }
  }
  const per = colW >= 11 ? 2 : 1;
  const counts = [0, 0, 0];
  for (const it of items) {
    const c = order.indexOf(it.status);
    if (c < 0) continue;
    const k = counts[c]++;
    const nx = x + c * colW + 1 + (k % per) * 5;
    const ny = y + 2 + Math.floor(k / per) * 4;
    if (ny + 3 > y + h) {
      if (k % per === 0) pinta(ctx, x + c * colW + Math.floor(colW / 2) - 1, y + h - 1, 3, 1, '#8a7a62');
      continue;
    }
    const id = h32(k + 1, c) % RUNA_COUNT;
    if (it.status === 'in_progress' && Math.floor(t / 600 + k) % 2 === 0) pinta(ctx, nx - 1, ny - 1, 6, 5, 'rgba(90,190,255,0.35)');
    const pedra = it.status === 'completed' ? '#9a8f80' : '#8d949c';
    pinta(ctx, nx, ny, 4, 3, pedra);
    pinta(ctx, nx, ny, 4, 1, mix(pedra, '#ffffff', 0.3));
    pinta(ctx, nx, ny + 2, 4, 1, mix(pedra, '#2b2f3b', 0.3));
    // a runa entalhada (miniatura: a haste e o primeiro traço da runa)
    const ink = it.status === 'pending' ? '#4a4f57' : it.status === 'in_progress' ? '#7fe0ff' : '#f0c850';
    pinta(ctx, nx + 1, ny, 1, 3, ink);
    pinta(ctx, nx + 2, ny + (id % 3 === 0 ? 0 : 1), 1, 1, ink);
  }
}
