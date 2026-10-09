// Testes dos móveis de Asgard dos salões (puros, sem DOM): cada tipo gera sprite em todas as variantes e estados,
// com as mesmas âncoras, `front` e regiões dinâmicas do contrato (api.ts) que o mundo usa.
import { describe, expect, it } from 'vitest';
import { FURNITURE, TILE, type FurnitureKind, type SpriteRectName } from '../api';
import { trim, type BufFurniture, type BufSprite } from '../core/sprite';
import { SEED_VARIATIONS, normalizeFurniture, renderFurniture } from '../furniture/index';
import { SALOES } from './saloes';

/** Os tipos que os salões redesenham (o trono, a Bifrost, a cozinha, o salão de lazer e o banheiro). */
const KINDS: FurnitureKind[] = [
  'throne', 'wolf', 'pillar', 'elevator', 'reception_desk', 'bench',
  'counter', 'counter_sink', 'coffee_machine', 'microwave', 'fridge', 'vending_machine', 'water_cooler', 'barrel', 'cafe_table', 'cafe_chair',
  'hearth', 'tv', 'arcade', 'pingpong_table', 'sofa', 'armchair', 'coffee_table', 'beanbag',
  'toilet_stall', 'sink', 'mirror',
];

/** Gera como o tema gera (art/asgard/index.ts): normaliza, desenha e recorta. */
function render(kind: FurnitureKind, variant?: string, state?: number, seed?: number): { base: BufSprite; front?: BufSprite } {
  const draw = SALOES[kind];
  if (!draw) throw new Error(`sem desenho para ${kind}`);
  const n = normalizeFurniture(kind, variant, state, seed);
  const f: BufFurniture = draw(n.variant, n.state, n.vseed);
  return { base: trim(f.base), front: f.front ? trim(f.front) : undefined };
}

function digest(s: BufSprite): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.buf.data.length; i++) h = Math.imul(h ^ s.buf.data[i], 0x01000193);
  return `${s.buf.w}x${s.buf.h}:${h >>> 0}`;
}

/** Pixels opacos acesos (algum canal forte): a luz do arco-íris, o núcleo e as runas da Bifrost. */
function lit(s: BufSprite): number {
  let n = 0;
  const d = s.buf.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && Math.max(d[i], d[i + 1], d[i + 2]) > 200) n++;
  return n;
}

/** Todas as combinações de variante × estado × semente do catálogo. */
function* combos(kind: FurnitureKind): Generator<[string | undefined, number, number]> {
  const def = FURNITURE[kind];
  for (const v of def.variants ?? [undefined]) {
    for (let st = 0; st < (def.states ?? 1); st++) {
      for (let seed = 0; seed < (SEED_VARIATIONS[kind] ?? 1); seed++) yield [v, st, seed];
    }
  }
}

describe('Asgard: móveis dos salões', () => {
  it('desenha todos os tipos pedidos (e só desenha tipos do catálogo)', () => {
    for (const kind of KINDS) expect(SALOES[kind], kind).toBeTypeOf('function');
    for (const kind of Object.keys(SALOES)) expect(FURNITURE[kind as FurnitureKind], kind).toBeDefined();
  });

  it('cada variante/estado gera sprite com âncora e regiões dentro do contrato', () => {
    for (const kind of KINDS) {
      const def = FURNITURE[kind];
      for (const [v, st, seed] of combos(kind)) {
        const id = `${kind}/${v ?? '-'}/${st}/${seed}`;
        const f = render(kind, v, st, seed);
        for (const s of [f.base, f.front]) {
          if (!s) continue;
          expect(s.buf.countOpaque(), id).toBeGreaterThan(8);
          expect(s.ax, id).toBeGreaterThanOrEqual(0);
          expect(s.ax, id).toBeLessThanOrEqual(s.buf.w);
          for (const r of Object.values(s.rects ?? {})) {
            if (!r) continue;
            expect(r.x, id).toBeGreaterThanOrEqual(0);
            expect(r.y, id).toBeGreaterThanOrEqual(0);
            expect(r.x + r.w, id).toBeLessThanOrEqual(s.buf.w);
            expect(r.y + r.h, id).toBeLessThanOrEqual(s.buf.h);
          }
          if (def.mount === 'floor') {
            // Não desce além da sombra nem flutua acima da pegada; no máximo ~3 tiles de altura.
            expect(s.buf.h - s.ay, id).toBeLessThanOrEqual(5);
            expect(s.ay - s.buf.h, id).toBeLessThan(def.footprint.h * TILE);
            expect(s.ay, id).toBeLessThanOrEqual(3 * TILE + def.footprint.h * TILE);
          } else {
            // Itens de parede ficam na face (2 tiles acima do rodapé), sem invadir a tampa.
            expect(s.ay, id).toBeGreaterThan(0);
            expect(s.ay, id).toBeLessThanOrEqual(2 * TILE);
          }
        }
        // Um móvel de chão chega ao chão (pés ou sombra na linha da pegada), pela base ou pela frente (a latrina).
        if (def.mount === 'floor') {
          const reach = Math.max(f.base.buf.h - f.base.ay, f.front ? f.front.buf.h - f.front.ay : -99);
          expect(reach, id).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('regiões dinâmicas do contrato: tela, espelho, brilho — opacas, com o tamanho que o mundo espera', () => {
    const want: [FurnitureKind, SpriteRectName][] = [['tv', 'tv'], ['arcade', 'screen'], ['mirror', 'glass'], ['vending_machine', 'glow'], ['hearth', 'glow']];
    for (const [kind, name] of want) {
      const s = render(kind).base;
      const r = s.rects?.[name];
      expect(r, `${kind}.${name}`).toBeDefined();
      if (!r) continue;
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) expect(s.buf.data[(y * s.buf.w + x) * 4 + 3], `${kind}.${name} (${x},${y})`).toBeGreaterThan(0);
      }
    }
    // Tela do fliperama e vidro do espelho: as mesmas medidas do Escritório (o jogo e o reflexo foram ajustados a elas).
    for (const [kind, name] of [['arcade', 'screen'], ['mirror', 'glass']] as const) {
      const mine = render(kind).base.rects?.[name];
      const office = renderFurniture(kind).base.rects?.[name];
      expect({ w: mine?.w, h: mine?.h }, kind).toEqual({ w: office?.w, h: office?.h });
    }
    const tv = render('tv').base.rects?.tv;
    expect(tv?.w).toBeGreaterThanOrEqual(24);
    expect(tv?.h).toBeGreaterThanOrEqual(12);
  });

  it('assentos de costas têm `front` (encosto por cima de quem senta); de frente não', () => {
    for (const kind of ['sofa', 'armchair', 'cafe_chair'] as const) {
      expect(render(kind, 'up').front, `${kind}/up`).toBeDefined();
      expect(render(kind, 'down').front, `${kind}/down`).toBeUndefined();
    }
    for (const st of [0, 1]) expect(render('toilet_stall', undefined, st).front, `toilet_stall/${st}`).toBeDefined();
    expect(render('throne').front).toBeUndefined();
  });

  it('estados: a Bifrost acende do apagado ao aberto; a latrina e o caldeirão mudam com o estado', () => {
    const portal = [0, 1, 2, 3, 4].map((st) => render('elevator', undefined, st).base);
    expect(new Set(portal.map(digest)).size).toBe(5);
    for (let st = 1; st < 5; st++) expect(lit(portal[st]), `estado ${st}`).toBeGreaterThan(lit(portal[st - 1]));
    expect(lit(portal[0])).toBe(0);
    const stall = [0, 1].map((st) => render('toilet_stall', undefined, st).front as BufSprite);
    expect(digest(stall[0])).not.toBe(digest(stall[1]));
    expect(digest(render('coffee_machine', undefined, 0).base)).not.toBe(digest(render('coffee_machine', undefined, 1).base));
  });

  it('variantes são desenhos diferentes; o lobo da esquerda é o espelho do da direita', () => {
    for (const kind of ['cafe_chair', 'armchair', 'sofa', 'beanbag', 'counter'] as const) {
      const vs = FURNITURE[kind].variants ?? [];
      expect(new Set(vs.map((v) => digest(render(kind, v).base))).size, kind).toBe(vs.length);
    }
    const right = render('wolf', 'right').base;
    const left = render('wolf', 'left').base;
    expect(left.buf.w).toBe(right.buf.w);
    expect(digest({ ...left, buf: left.buf.flipped() })).toBe(digest(right));
    expect(left.ax + right.ax).toBe(right.buf.w);
    expect(digest(render('coffee_table', undefined, 0, 0).base)).not.toBe(digest(render('coffee_table', undefined, 0, 1).base));
  });

  it('é determinístico', () => {
    for (const kind of KINDS) {
      for (const [v, st, seed] of combos(kind)) {
        const a = render(kind, v, st, seed);
        const b = render(kind, v, st, seed);
        expect(digest(a.base)).toBe(digest(b.base));
        if (a.front && b.front) expect(digest(a.front)).toBe(digest(b.front));
      }
    }
  });
});
