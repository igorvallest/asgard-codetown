// Testes das superfícies de Asgard (puras, sem DOM): paletas, pisos, tapetes, paredes, terreno e os desenhos por
// quadro (telas, quadro, janela e relógio) com um contexto falso que só registra fillRect.
import { describe, expect, it } from 'vitest';
import { FURNITURE, TILE, type FloorKind, type Rect, type ScreenMode, type WallPattern } from '../api';
import { footballLance } from '../dynamic';
import { CHUNK_PX } from '../surfaces/floor';
import { asgardDrawBoard, asgardDrawClock, asgardDrawWindowView } from './superficies-janela';
import { ASGARD_THEME_COUNT, asgardRoomTheme } from './superficies-paletas';
import { asgardSouthWallTile, asgardWallFaceTile } from './superficies-paredes';
import { asgardFloorChunk, renderAsgardRug } from './superficies-pisos';
import { asgardDrawScreen } from './superficies-runas';
import { ASGARD_PROPS, asgardProp } from './superficies-terreno';

const FLOORS: FloorKind[] = ['carpet', 'wood', 'tile_check', 'tile_white', 'concrete', 'marble', 'grass', 'sidewalk', 'street'];
const PATTERNS: WallPattern[] = ['plain', 'stripes', 'tiles', 'wood_panel', 'brick', 'glass', 'marble'];
const MODES: ScreenMode[] = ['off', 'standby', 'idle', 'code', 'terminal', 'browser', 'search', 'chat', 'docs', 'tasks', 'alert', 'progress', 'show', 'game'];

interface Fill {
  c: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Contexto falso: registra cada fillRect com a cor do momento. */
function fakeCtx(): { ctx: CanvasRenderingContext2D; fills: Fill[] } {
  const fills: Fill[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ c: String((ctx as { fillStyle: string }).fillStyle), x, y, w, h });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
}

const inside = (fills: Fill[], r: Rect) => fills.every((f) => f.x >= r.x && f.y >= r.y && f.x + f.w <= r.x + r.w && f.y + f.h <= r.y + r.h && f.w > 0 && f.h > 0);
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
/** Quantos pixels do buffer têm exatamente a cor `hex` (#rrggbb). */
function countColor(data: Uint8ClampedArray, hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  let c = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200 && data[i] === n >> 16 && data[i + 1] === ((n >> 8) & 255) && data[i + 2] === (n & 255)) c++;
  return c;
}

describe('paletas das salas', () => {
  it('têm as chaves de RoomTheme com variantes de mesa, cadeira e parede que o catálogo conhece', () => {
    for (let i = 0; i < ASGARD_THEME_COUNT; i++) {
      const t = asgardRoomTheme(i);
      expect(Object.keys(t).sort()).toEqual(['accent', 'carpet', 'carpet2', 'chairVariant', 'deskVariant', 'wall']);
      expect(FURNITURE.desk.variants).toContain(t.deskVariant);
      expect(FURNITURE.office_chair.variants).toContain(t.chairVariant);
      expect(PATTERNS).toContain(t.wall.pattern);
      for (const c of [t.carpet, t.carpet2, t.accent, t.wall.base, t.wall.trim ?? '']) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('vizinhas são diferentes, determinísticas e o ciclo fecha (inclusive com semente negativa)', () => {
    for (let i = 0; i < 30; i++) {
      expect(asgardRoomTheme(i)).toEqual(asgardRoomTheme(i));
      expect(asgardRoomTheme(i).carpet).not.toBe(asgardRoomTheme(i + 1).carpet);
      expect(asgardRoomTheme(i).accent).not.toBe(asgardRoomTheme(i + 1).accent);
    }
    expect(asgardRoomTheme(ASGARD_THEME_COUNT)).toEqual(asgardRoomTheme(0));
    expect(asgardRoomTheme(-1)).toEqual(asgardRoomTheme(ASGARD_THEME_COUNT - 1));
    // cópia: mexer na parede devolvida não altera a paleta
    asgardRoomTheme(0).wall.base = '#000000';
    expect(asgardRoomTheme(0).wall.base).not.toBe('#000000');
  });
});

describe('pisos e tapetes', () => {
  const opts = { seed: 3, tint: '#8e3b2e', tint2: '#7a3127' };

  it('blocos de todos os pisos são opacos e determinísticos', () => {
    for (const k of FLOORS) {
      const a = asgardFloorChunk(k, 2, -1, opts);
      expect(a.countOpaque(), k).toBe(CHUNK_PX * CHUNK_PX);
      expect(asgardFloorChunk(k, 2, -1, opts).data, k).toEqual(a.data);
    }
  });

  it('as tábuas continuam entre blocos vizinhos (sem emenda na borda)', () => {
    for (const k of ['wood', 'carpet'] as const) {
      const left = asgardFloorChunk(k, 0, 0, { seed: 1, tint: '#5d6e43' });
      const right = asgardFloorChunk(k, 1, 0, { seed: 1, tint: '#5d6e43' });
      // o último x do bloco da esquerda e o primeiro da direita são vizinhos no mundo: só as pontas de tábua
      // (poucas linhas) podem mudar de cor de forma brusca
      let differ = 0;
      for (let y = 0; y < CHUNK_PX; y++) {
        const i = (y * CHUNK_PX + CHUNK_PX - 1) * 4;
        const j = y * CHUNK_PX * 4;
        if (Math.abs(left.data[i] - right.data[j]) > 24) differ++;
      }
      expect(differ, k).toBeLessThan(CHUNK_PX / 3);
    }
  });

  it('as juntas da pedra polida seguem a grade do mundo (placas de 32 px), não a do bloco', () => {
    const a = asgardFloorChunk('marble', 0, 0, { seed: 1 });
    const b = asgardFloorChunk('marble', 3, 2, { seed: 1 });
    // a coluna 31 de qualquer bloco é junta (ou ouro no cruzamento) em todas as linhas
    const seam = (buf: typeof a, x: number) => {
      let n = 0;
      for (let y = 0; y < CHUNK_PX; y++) {
        const i = (y * CHUNK_PX + x) * 4;
        const hex = `#${[0, 1, 2].map((k) => buf.data[i + k].toString(16).padStart(2, '0')).join('')}`;
        if (hex === '#69727c' || hex === '#c9a03e' || hex === '#f3d77e') n++;
      }
      return n;
    };
    expect(seam(a, 31)).toBe(CHUNK_PX);
    expect(seam(b, 63)).toBe(CHUNK_PX);
    expect(seam(a, 40)).toBeLessThan(CHUNK_PX / 4);
  });

  it('tábuas tingidas seguem a cor da sala e a pedra polida tem veios e incrustações de ouro', () => {
    const red = asgardFloorChunk('carpet', 0, 0, { seed: 2, tint: '#8e3b2e' });
    const blue = asgardFloorChunk('carpet', 0, 0, { seed: 2, tint: '#3f5a7a' });
    const avg = (d: Uint8ClampedArray, c: number) => {
      let s = 0;
      for (let i = c; i < d.length; i += 4) s += d[i];
      return s / (d.length / 4);
    };
    expect(avg(red.data, 0)).toBeGreaterThan(avg(blue.data, 0));
    expect(avg(blue.data, 2)).toBeGreaterThan(avg(red.data, 2));
    let gold = 0;
    for (let cx = 0; cx < 3; cx++) gold += countColor(asgardFloorChunk('marble', cx, 0, { seed: 5 }).data, '#f3d77e');
    expect(gold).toBeGreaterThan(0);
  });

  /** Pixels de neve (miolo, luz, sombras e brilho; sem os flocos soltos) de um bloco de grama. */
  const NEVE = ['#e9eef3', '#f6f9fc', '#d3dde8', '#b6c5d8', '#ffffff'];
  const neveEm = (data: Uint8ClampedArray) => NEVE.reduce((n, c) => n + countColor(data, c), 0);

  it('o gramado tem manchas de neve pequenas e esparsas, com a borda de baixo azulada', () => {
    let snow = 0;
    let shadow = 0;
    let total = 0;
    for (let cy = 0; cy < 4; cy++) {
      for (let cx = 0; cx < 4; cx++) {
        const g = asgardFloorChunk('grass', cx, cy, { seed: 21 });
        snow += neveEm(g.data);
        shadow += countColor(g.data, '#b6c5d8');
        total += CHUNK_PX * CHUNK_PX;
      }
    }
    expect(snow).toBeGreaterThan(total * 0.01);
    expect(snow).toBeLessThan(total * 0.1);
    expect(shadow).toBeGreaterThan(snow * 0.08);
  });

  it('sem neve na faixa de 8 tiles junto às bordas do gramado (o mundo amostra o canto para o fundo)', () => {
    const area = { x: -96, y: -64, w: 48 * TILE, h: 44 * TILE };
    let band = 0;
    let inner = 0;
    for (let cy = Math.floor(area.y / CHUNK_PX); cy < Math.ceil((area.y + area.h) / CHUNK_PX); cy++) {
      for (let cx = Math.floor(area.x / CHUNK_PX); cx < Math.ceil((area.x + area.w) / CHUNK_PX); cx++) {
        const g = asgardFloorChunk('grass', cx, cy, { seed: 21 }, area);
        for (let py = 0; py < CHUNK_PX; py++) {
          for (let px = 0; px < CHUNK_PX; px++) {
            const wx = cx * CHUNK_PX + px;
            const wy = cy * CHUNK_PX + py;
            const d = Math.min(wx - area.x, area.x + area.w - 1 - wx, wy - area.y, area.y + area.h - 1 - wy);
            if (d < 0) continue;
            const i = (py * CHUNK_PX + px) * 4;
            const hex = `#${[0, 1, 2].map((k) => g.data[i + k].toString(16).padStart(2, '0')).join('')}`;
            if (!NEVE.includes(hex)) continue;
            if (d < 8 * TILE) band++;
            else inner++;
          }
        }
      }
    }
    expect(band).toBe(0);
    expect(inner).toBeGreaterThan(0);
  });

  it('tapetes: corpo opaco, franjas nas pontas curtas e campo com lã crua de contraste', () => {
    // tamanhos reais do mundo: tapete da sala, passadeira do trono, capacho, tapete das pias e o do corredor
    for (const [w, h] of [[112, 88], [32, 138], [40, 20], [48, 14], [192, 18]] as const) {
      for (const seed of [0, 1, 2]) {
        const b = renderAsgardRug(w, h, '#8e3b2e', seed);
        expect(b.w).toBe(w);
        expect(b.h).toBe(h);
        expect(b.countOpaque()).toBeGreaterThan(w * h * 0.85);
        expect(renderAsgardRug(w, h, '#8e3b2e', seed).data).toEqual(b.data);
        if (Math.min(w, h) >= 8) expect(countColor(b.data, '#e9dfc6'), `${w}x${h} s${seed}`).toBeGreaterThan(0);
      }
    }
    // franjas (fio sim, fio não) nas pontas curtas: na lateral do tapete deitado, no topo da passadeira em pé
    const deitado = renderAsgardRug(40, 20, '#3f5a7a', 0);
    expect(deitado.alpha(0, 2)).toBeGreaterThan(0);
    expect(deitado.alpha(0, 3)).toBe(0);
    const emPe = renderAsgardRug(32, 138, '#3f5a7a', 0);
    expect(emPe.alpha(2, 0)).toBeGreaterThan(0);
    expect(emPe.alpha(3, 0)).toBe(0);
    expect(emPe.alpha(0, 3)).toBeGreaterThan(0);
  });
});

describe('paredes', () => {
  it('faces e muretas renderizam todos os padrões (vidro translúcido, o resto opaco)', () => {
    for (const p of PATTERNS) {
      for (const exterior of [false, true]) {
        for (let col = 0; col < 4; col++) {
          const style = { base: '#8f8a83', trim: '#5e564c', pattern: p, exterior };
          const face = asgardWallFaceTile(style, col, col % 3);
          expect(face.w).toBe(TILE);
          expect(face.h).toBe(2 * TILE);
          if (p === 'glass') expect(face.countOpaque()).toBeGreaterThan(TILE * 8);
          else expect(face.countOpaque(), `${p} col ${col}`).toBe(TILE * 2 * TILE);
          expect(asgardWallFaceTile(style, col, col % 3).data).toEqual(face.data);
          expect(asgardSouthWallTile(style, col).countOpaque(), `${p} sul`).toBe(TILE * TILE);
        }
      }
    }
  });

  it('as cores claras do Escritório viram madeira e pedra, sem perder o tom do estilo', () => {
    const avgLum = (d: Uint8ClampedArray) => {
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return s / (d.length / 4) / 255;
    };
    const office = asgardWallFaceTile({ base: '#eef0ee', trim: '#9aa6ad', pattern: 'plain' }, 0, 0);
    const dark = asgardWallFaceTile({ base: '#6b4a32', trim: '#3e2a1c', pattern: 'plain' }, 0, 0);
    expect(avgLum(office.data)).toBeLessThan(0.6);
    expect(avgLum(office.data)).toBeGreaterThan(avgLum(dark.data));
  });

  it('a pedra emenda no ciclo de 64 px (a coluna 3 encosta na coluna 0)', () => {
    const style = { base: '#8f8a83', trim: '#5e564c', pattern: 'brick' as const };
    const last = asgardWallFaceTile(style, 3, 0);
    const first = asgardWallFaceTile(style, 0, 0);
    // em cada linha da face, ou as duas bordas são da mesma pedra (cor próxima) ou uma delas é junta (escura)
    let broken = 0;
    for (let y = 5; y < 28; y++) {
      const i = (y * TILE + TILE - 1) * 4;
      const j = y * TILE * 4;
      const a = last.data[i] + last.data[i + 1] + last.data[i + 2];
      const b = first.data[j] + first.data[j + 1] + first.data[j + 2];
      if (Math.abs(a - b) > 90) broken++;
    }
    expect(broken).toBeLessThan(8);
  });
});

describe('telas (pergaminhos mágicos)', () => {
  const SIZES: Rect[] = [{ x: 10, y: 20, w: 14, h: 9 }, { x: 3, y: 4, w: 28, h: 15 }, { x: 0, y: 0, w: 10, h: 7 }, { x: 5, y: 5, w: 13, h: 9 }];

  it('todos os modos ficam dentro do retângulo, com poucos fills, em todos os tamanhos', () => {
    for (const r of SIZES) {
      for (const m of MODES) {
        for (const t of [0, 777, 12345, 99999]) {
          for (const seed of [0, 1, 2, 5]) {
            const { ctx, fills } = fakeCtx();
            asgardDrawScreen(ctx, r, m, t, seed);
            expect(fills.length, m).toBeGreaterThan(0);
            expect(fills.length, `${m} ${r.w}x${r.h}`).toBeLessThan(200);
            expect(inside(fills, r), `${m} ${r.w}x${r.h} t=${t}`).toBe(true);
          }
        }
      }
    }
  });

  it('custo independente de t (o mundo passa Date.now())', () => {
    const r = { x: 10, y: 20, w: 14, h: 9 };
    const t0 = performance.now();
    for (const m of MODES) {
      for (let k = 0; k < 40; k++) {
        const { ctx, fills } = fakeCtx();
        asgardDrawScreen(ctx, r, m, 1.8e12 + k * 997, k);
        expect(fills.length, m).toBeLessThan(200);
        expect(inside(fills, r)).toBe(true);
      }
    }
    expect(performance.now() - t0).toBeLessThan(1000);
  });

  it("'off' é pergaminho apagado (nunca quase preto) e mais escuro que o ligado; 'standby' pulsa", () => {
    const r = { x: 0, y: 0, w: 14, h: 9 };
    const bg = (m: ScreenMode) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawScreen(ctx, r, m, 0, 1);
      return fills[0].c;
    };
    expect(lum(bg('off'))).toBeGreaterThan(0.15);
    expect(lum(bg('off'))).toBeLessThan(lum(bg('idle')));
    const snap = (t: number) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawScreen(ctx, r, 'standby', t, 1);
      return JSON.stringify(fills);
    };
    expect(new Set([0, 700, 1400, 2100].map(snap)).size).toBeGreaterThan(1);
  });

  it("'alert' arde em vermelho e pisca", () => {
    const r = { x: 0, y: 0, w: 14, h: 9 };
    for (const t of [0, 380]) {
      const { ctx, fills } = fakeCtx();
      asgardDrawScreen(ctx, r, 'alert', t, 1);
      const n = parseInt(fills[0].c.slice(1), 16);
      expect(n >> 16).toBeGreaterThan(2 * ((n >> 8) & 255));
      expect(fills[0]).toMatchObject({ x: 0, y: 0, w: 14, h: 9 });
    }
  });

  it("'progress' acende as runas em sequência e recomeça", () => {
    const r = { x: 0, y: 0, w: 14, h: 9 };
    const lit = (t: number) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawScreen(ctx, r, 'progress', t, 2);
      return fills.filter((f) => f.c === '#c47a0c' || f.c === '#1f9be8' || f.c === '#fff4c8').length;
    };
    for (const base of [0, 1.8e12]) {
      const counts = Array.from({ length: 48 }, (_, k) => lit(base + k * 100));
      expect(Math.max(...counts)).toBeGreaterThan(10);
      expect(Math.min(...counts)).toBeLessThanOrEqual(2);
      let grows = 0;
      for (let k = 1; k < counts.length; k++) if (counts[k] > counts[k - 1]) grows++;
      expect(grows).toBeGreaterThan(3);
    }
  });

  it("'show': visão fixa pela semente, e o gol do knattleikr acontece junto com footballLance", () => {
    const r = { x: 3, y: 4, w: 28, h: 15 };
    const colors = (seed: number, t = 1234) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawScreen(ctx, r, 'show', t, seed);
      return fills.map((f) => f.c);
    };
    for (const k of [0, 3, 6]) {
      expect(colors(k), `gelo ${k}`).toContain('#9cc4d8');
      expect(colors(k + 1), `saga ${k + 1}`).toContain('#6a3a2a');
      expect(colors(k + 2), `Sleipnir ${k + 2}`).toContain('#e8454a');
    }
    const banner = 'rgba(12,16,28,0.78)';
    for (let t = 0; t < 14000; t += 250) {
      const goal = footballLance(t, 3).progress >= footballLance(t, 3).goalAt;
      expect(colors(3, t).includes(banner), `t=${t}`).toBe(goal);
    }
  });

  it("'game': duelo de magias com barras de vida, e a runa da vitória aparece no fim do duelo", () => {
    const r = { x: 3, y: 4, w: 28, h: 15 };
    const some = (seed: number) => {
      for (let t = 0; t < 9000; t += 50) {
        const { ctx, fills } = fakeCtx();
        asgardDrawScreen(ctx, r, 'game', t, seed);
        if (fills.some((f) => f.c === 'rgba(12,16,28,0.78)')) return true;
      }
      return false;
    };
    expect(some(0)).toBe(true);
    expect(some(1)).toBe(true);
    const { ctx, fills } = fakeCtx();
    asgardDrawScreen(ctx, r, 'game', 100, 0);
    expect(fills.some((f) => f.c === '#ffd84d')).toBe(true);
  });
});

describe('quadro, janela e relógio', () => {
  it('ficam dentro do retângulo', () => {
    const win = { x: 4, y: 6, w: 24, h: 15 };
    for (const hour of [0, 3, 5.8, 7, 12, 17.5, 18.4, 19.6, 22, 23.99]) {
      for (const t of [0, 5000, 60000]) {
        const { ctx, fills } = fakeCtx();
        asgardDrawWindowView(ctx, win, hour, t, 9);
        expect(inside(fills, win), `hora ${hour}`).toBe(true);
      }
    }
    const board = { x: 2, y: 2, w: 44, h: 15 };
    const b = fakeCtx();
    asgardDrawBoard(b.ctx, board, Array.from({ length: 30 }, (_, i) => ({ status: (['pending', 'in_progress', 'completed'] as const)[i % 3] })), 1000);
    expect(inside(b.fills, board)).toBe(true);
    const face = { x: 3, y: 3, w: 10, h: 10 };
    const c = fakeCtx();
    for (let h = 0; h < 24; h++) asgardDrawClock(c.ctx, face, new Date(2026, 0, 1, h, h * 2, h));
    expect(inside(c.fills, face)).toBe(true);
  });

  it('a janela mostra aurora à noite e não ao meio-dia', () => {
    const win = { x: 0, y: 0, w: 24, h: 15 };
    const aurora = (hour: number) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawWindowView(ctx, win, hour, 1000, 3);
      return fills.some((f) => f.c.startsWith('rgba(90,255,170'));
    };
    expect(aurora(23)).toBe(true);
    expect(aurora(12)).toBe(false);
  });

  it('o relógio mostra o sol de dia e a lua de noite', () => {
    const face = { x: 0, y: 0, w: 10, h: 10 };
    const has = (h: number, c: string) => {
      const { ctx, fills } = fakeCtx();
      asgardDrawClock(ctx, face, new Date(2026, 0, 1, h, 0, 0));
      return fills.some((f) => f.c === c);
    };
    expect(has(12, '#ffd75a')).toBe(true);
    expect(has(12, '#e8ecf8')).toBe(false);
    expect(has(0, '#e8ecf8')).toBe(true);
    expect(has(0, '#ffd75a')).toBe(false);
  });

  it('o quadro distingue a fazer, fazendo e feito', () => {
    const board = { x: 0, y: 0, w: 44, h: 15 };
    const ink = (status: 'pending' | 'in_progress' | 'completed') => {
      const { ctx, fills } = fakeCtx();
      asgardDrawBoard(ctx, board, [{ status }], 0);
      return new Set(fills.map((f) => f.c));
    };
    expect(ink('pending').has('#4a4f57')).toBe(true);
    expect(ink('in_progress').has('#7fe0ff')).toBe(true);
    expect(ink('completed').has('#f0c850')).toBe(true);
  });
});

describe('terreno externo', () => {
  it('todos os elementos de Asgard têm sprite com âncora na base e são determinísticos', () => {
    for (const kind of ASGARD_PROPS) {
      for (let seed = 0; seed < 7; seed++) {
        const s = asgardProp(kind, seed);
        expect(s, kind).not.toBeNull();
        if (!s) continue;
        expect(s.buf.countOpaque(), kind).toBeGreaterThan(20);
        expect(s.ax).toBeGreaterThan(0);
        expect(s.ax).toBeLessThan(s.buf.w);
        expect(s.ay).toBeGreaterThan(s.buf.h / 2);
        expect(s.ay).toBeLessThanOrEqual(s.buf.h);
        expect(asgardProp(kind, seed)?.buf.data).toEqual(s.buf.data);
      }
    }
  });

  it('os demais tipos ficam com o mundo (null)', () => {
    for (const kind of ['lamp', 'bench', 'hedge', 'parasol', 'totem', 'paving', 'xyz']) expect(asgardProp(kind, 1)).toBeNull();
  });

  it('o pinheiro nevado tem neve e o comum não', () => {
    const snow = (kind: string) => countColor(asgardProp(kind, 2)?.buf.data ?? new Uint8ClampedArray(), '#eef3f8');
    expect(snow('snowpine')).toBeGreaterThan(15);
    expect(snow('pine')).toBe(0);
  });
});
