// Testes dos móveis de trabalho de Asgard (puros, sem DOM): cada tipo, variante, estado e variação gera sprite com
// âncora coerente e com os retângulos do contrato (api.ts) dentro dele e sobre o desenho certo.
import { describe, expect, it } from 'vitest';
import { FURNITURE, TILE, type FurnitureKind, type Rect, type SpriteRectName } from '../api';
import { trim, type BufFurniture, type BufSprite } from '../core/sprite';
import { SEED_VARIATIONS, normalizeFurniture } from '../furniture/index';
import { TRABALHO } from './trabalho';

/** Tudo o que este módulo redesenha; nenhum pode faltar. */
const KINDS: readonly FurnitureKind[] = [
  'desk', 'desk_back', 'office_chair', 'office_chair_front', 'bookshelf', 'binder_shelf', 'filing_cabinet', 'printer',
  'trash_bin', 'meeting_table', 'stool', 'floor_lamp', 'glass_partition', 'plant_small', 'plant_tall', 'weapon_rack',
  'runestone', 'whiteboard', 'window', 'clock', 'poster', 'painting', 'sign', 'light_switch', 'door_frame', 'shelf_wall',
  'banner',
];

/** Regiões que o contrato pede por tipo. */
const PEDIDAS: Partial<Record<FurnitureKind, SpriteRectName[]>> = {
  desk: ['screen'],
  whiteboard: ['board'],
  window: ['glass'],
  clock: ['face'],
  painting: ['art'],
  sign: ['sign'],
  floor_lamp: ['glow'],
};

/** Superfícies onde o mundo desenha por cima (runas, tarefas, nome, pintura): têm de estar cobertas pelo sprite. */
const SUPERFICIES: readonly SpriteRectName[] = ['screen', 'screen2', 'board', 'sign', 'art'];

/** Como art/asgard/index.ts entrega ao mundo: normalizado e recortado ao conteúdo. */
function render(kind: FurnitureKind, variant?: string, state = 0, seed = 0): BufFurniture {
  const n = normalizeFurniture(kind, variant, state, seed);
  const draw = TRABALHO[kind];
  if (!draw) throw new Error(`sem desenho para ${kind}`);
  const f = draw(n.variant, n.state, n.vseed);
  return { base: trim(f.base), front: f.front ? trim(f.front) : undefined };
}

function combos(kind: FurnitureKind): { v: string | undefined; st: number; seed: number }[] {
  const def = FURNITURE[kind];
  const out: { v: string | undefined; st: number; seed: number }[] = [];
  for (const v of def.variants ?? [undefined]) {
    for (let st = 0; st < (def.states ?? 1); st++) {
      for (let seed = 0; seed < (SEED_VARIATIONS[kind] ?? 1); seed++) out.push({ v, st, seed });
    }
  }
  return out;
}

const alphaAt = (s: BufSprite, x: number, y: number) => s.buf.data[(y * s.buf.w + x) * 4 + 3];

function pixels(r: Rect): [number, number][] {
  const out: [number, number][] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) out.push([x, y]);
  return out;
}

describe('móveis de trabalho de Asgard', () => {
  it('redesenha todos os tipos pedidos', () => {
    for (const kind of KINDS) expect(TRABALHO[kind], kind).toBeTypeOf('function');
  });

  it('cada tipo/variante/estado/variação gera sprite com âncora coerente e os retângulos do contrato dentro dele', () => {
    for (const kind of KINDS) {
      const def = FURNITURE[kind];
      for (const { v, st, seed } of combos(kind)) {
        const tag = `${kind}/${v ?? '-'}/${st}/${seed}`;
        const f = render(kind, v, st, seed);
        for (const s of [f.base, f.front]) {
          if (!s) continue;
          expect(s.buf.countOpaque(), tag).toBeGreaterThan(8);
          expect(s.ax, tag).toBeGreaterThanOrEqual(0);
          expect(s.ax, tag).toBeLessThanOrEqual(s.buf.w);
          if (def.mount === 'floor') {
            // Não desce além da sombra nem flutua acima do footprint.
            expect(s.buf.h - s.ay, tag).toBeLessThanOrEqual(5);
            expect(s.ay - s.buf.h, tag).toBeLessThan(def.footprint.h * TILE);
          } else {
            // Na face da parede: acima do rodapé e dentro dos 2 tiles.
            expect(s.ay, tag).toBeGreaterThan(0);
            expect(s.ay - s.buf.h, tag).toBeLessThanOrEqual(2 * TILE);
          }
          for (const [name, r] of Object.entries(s.rects ?? {}) as [SpriteRectName, Rect][]) {
            const rt = `${tag} rects.${name}`;
            expect(r.w, rt).toBeGreaterThan(0);
            expect(r.h, rt).toBeGreaterThan(0);
            expect(r.x, rt).toBeGreaterThanOrEqual(0);
            expect(r.y, rt).toBeGreaterThanOrEqual(0);
            expect(r.x + r.w, rt).toBeLessThanOrEqual(s.buf.w);
            expect(r.y + r.h, rt).toBeLessThanOrEqual(s.buf.h);
            if (SUPERFICIES.includes(name)) {
              const vazados = pixels(r).filter(([x, y]) => alphaAt(s, x, y) < 200).length;
              expect(vazados, `${rt}: pixels vazados`).toBe(0);
            }
          }
        }
        for (const name of PEDIDAS[kind] ?? []) expect(f.base.rects?.[name], `${tag} rects.${name}`).toBeDefined();
      }
    }
  });

  it('a folha do pergaminho tem espaço para as runas e o 2º pergaminho/grimório vem em rects.screen2', () => {
    for (const v of FURNITURE.desk.variants ?? []) {
      for (let seed = 0; seed < 6; seed++) {
        const r = render('desk', v, 0, seed).base.rects;
        expect(r?.screen?.w, `${v}/${seed}`).toBeGreaterThanOrEqual(12);
        expect(r?.screen?.h, `${v}/${seed}`).toBeGreaterThanOrEqual(8);
        expect(r?.screen2 !== undefined, `${v}/${seed}`).toBe([1, 2, 4].includes(seed));
      }
    }
  });

  it('o vidro da janela fica vazado (o mundo desenha o céu por trás) e o mostrador cobre o giro dos ponteiros', () => {
    const win = render('window').base;
    const g = win.rects?.glass as Rect;
    const abertos = pixels(g).filter(([x, y]) => alphaAt(win, x, y) < 128).length;
    expect(abertos / (g.w * g.h)).toBeGreaterThan(0.5);
    const clock = render('clock').base;
    const r = clock.rects?.face as Rect;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const fora = pixels(r).filter(([x, y]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= 4 && alphaAt(clock, x, y) < 200);
    expect(fora.length).toBe(0);
  });

  it('cadeira de costas tem encosto em `front`; a de frente não', () => {
    for (const v of FURNITURE.office_chair.variants ?? []) {
      expect(render('office_chair', v).front, v).toBeDefined();
      expect(render('office_chair_front', v).front, v).toBeUndefined();
    }
  });

  it('a tocha acesa e a apagada ocupam a mesma caixa visível (na mureta o mundo centraliza por ela)', () => {
    const caixa = (s: BufSprite) => {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (let y = 0; y < s.buf.h; y++) {
        for (let x = 0; x < s.buf.w; x++) {
          if (alphaAt(s, x, y) <= 16) continue;
          x0 = Math.min(x0, x - s.ax);
          y0 = Math.min(y0, y - s.ay);
          x1 = Math.max(x1, x - s.ax);
          y1 = Math.max(y1, y - s.ay);
        }
      }
      return [x0, y0, x1, y1];
    };
    const on = render('light_switch', 'on').base;
    const off = render('light_switch', 'off').base;
    expect(caixa(off)).toEqual(caixa(on));
    expect(on.buf.data).not.toEqual(off.buf.data);
  });

  it('variantes de escudo e estandarte são diferentes entre si e o desenho é determinístico', () => {
    for (const kind of ['poster', 'banner'] as const) {
      const vs = FURNITURE[kind].variants ?? [];
      const keys = new Set(vs.map((v) => render(kind, v).base.buf.data.join(',')));
      expect(keys.size, kind).toBe(vs.length);
    }
    for (const kind of KINDS) {
      const a = render(kind, undefined, 0, 1).base.buf.data;
      const b = render(kind, undefined, 0, 1).base.buf.data;
      expect(a, kind).toEqual(b);
    }
  });
});
