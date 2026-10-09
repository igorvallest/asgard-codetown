import { describe, expect, it } from 'vitest';
import { FURNITURE, type RoomTheme } from '../../art/api';
import { COL_W, CORRIDOR_H, ROOM_H } from '../constants';
import { asgardCell, asgardFixedAreas, asgardPlan, bandOf, BATH_ID, HALL_ID, KITCHEN_ID, THRONE_ID } from './asgard';
import { layoutCafe } from './core';
import type { AreaLayout } from './types';

const theme: RoomTheme = {
  carpet: '#4f6d8f',
  carpet2: '#486685',
  wall: { base: '#e6e2da', trim: '#9a8f80', pattern: 'plain' },
  accent: '#3f7fd8',
  deskVariant: 'wood',
  chairVariant: 'black',
};

const roomsFor = (slots: number[]) => slots.map((slot) => asgardPlan.room({ id: `/proj/${slot}`, slot, seed: 1000 + slot * 77 }, theme));

describe('Asgard: vagas', () => {
  it('fileiras de 3 crescendo para baixo, faixa a faixa', () => {
    expect([0, 1, 2].map((s) => asgardCell(s))).toEqual([0, 1, 2].map((i) => ({ rect: { x: i * COL_W, y: 29, w: COL_W, h: ROOM_H }, side: 'south' })));
    expect(asgardCell(3)).toEqual({ rect: { x: 0, y: 41, w: COL_W, h: ROOM_H }, side: 'north' });
    expect(asgardCell(5).rect.x).toBe(2 * COL_W);
    expect(asgardCell(6)).toEqual({ rect: { x: 0, y: 58, w: COL_W, h: ROOM_H }, side: 'south' });
    expect(asgardCell(9)).toEqual({ rect: { x: 0, y: 70, w: COL_W, h: ROOM_H }, side: 'north' });
    // vaga maior nunca fica acima de uma menor (o compact() muda a mais distante para a vaga livre)
    for (let s = 1; s < 30; s++) expect(asgardCell(s).rect.y).toBeGreaterThanOrEqual(asgardCell(s - 1).rect.y);
    expect([0, 2, 3, 8, 9].map(bandOf)).toEqual([0, 0, 1, 1, 2]);
    expect(asgardPlan.extentFor([])).toBe(1);
    expect(asgardPlan.extentFor([0, 1, 2])).toBe(1);
    expect(asgardPlan.extentFor([0, 4])).toBe(2);
  });
});

describe('Asgard: prédio', () => {
  for (const slots of [[0, 1, 2], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [1, 4, 8, 12]]) {
    const rooms = roomsFor(slots);
    const bands = asgardPlan.extentFor(slots);
    const b = asgardPlan.assemble(bands, rooms);
    const throne = b.core.find((a) => a.id === THRONE_ID)!;
    const bifrost = throne.spots.filter((s) => s.kind === 'elevator');
    const reach = b.grid.reachableFrom(bifrost[0].tx, bifrost[0].ty);
    const reachable = (x: number, y: number) => reach[y * b.grid.w + x] === 1;
    const areas: AreaLayout[] = [...b.core, b.corridor, ...rooms];

    it(`vagas ${slots.join(',')}: Bifrost com dois feixes e tudo alcançável a partir dela`, () => {
      expect(bifrost).toHaveLength(2);
      expect(b.rect).toEqual(asgardPlan.rectFor(bands));
      expect(b.spots.filter((s) => !reachable(s.tx, s.ty)).map((s) => s.id)).toEqual([]);
    });

    it(`vagas ${slots.join(',')}: cada sala sai no corredor da sua faixa`, () => {
      for (const room of rooms) {
        const door = room.door!;
        const outside = room.side === 'north' ? door.y + door.h : door.y - 1;
        for (let x = door.x; x < door.x + door.w; x++) expect(reachable(x, outside)).toBe(true);
        const corridor = areas.find((a) => a.kind === 'corridor' && a.rect.y <= outside && outside < a.rect.y + a.rect.h && a.rect.h === CORRIDOR_H);
        expect(corridor, room.id).toBeDefined();
      }
    });

    it(`vagas ${slots.join(',')}: áreas não se sobrepõem, móveis ficam dentro e ids são únicos`, () => {
      for (let i = 0; i < areas.length; i++) {
        for (let j = i + 1; j < areas.length; j++) {
          const a = areas[i].rect;
          const c = areas[j].rect;
          const overlap = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
          expect(overlap, `${areas[i].id} x ${areas[j].id}`).toBe(false);
        }
        const area = areas[i];
        for (const f of area.furniture) {
          const def = FURNITURE[f.kind];
          expect(f.tx >= area.rect.x && f.tx + def.footprint.w <= area.rect.x + area.rect.w && f.ty >= area.rect.y && f.ty + def.footprint.h <= area.rect.y + area.rect.h, f.id).toBe(true);
        }
      }
      const ids = b.spots.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

describe('Asgard: sala de projeto', () => {
  it('mesmo contrato da sala do Escritório (mesas, lugares extras, em pé, interruptor, quadro e placa), nos dois lados', () => {
    for (const slot of [0, 1, 3, 4, 7]) {
      const room = roomsFor([slot])[0];
      const desks = room.spots.filter((s) => s.kind === 'desk');
      expect(desks).toHaveLength(6);
      expect(new Set(desks.map((d) => d.rank))).toEqual(new Set([0, 1, 2, 3, 4, 5]));
      expect(desks.filter((d) => d.side === 'N')).toHaveLength(3);
      expect(room.spots.filter((s) => s.kind === 'stool' || s.kind === 'nook').length).toBeGreaterThanOrEqual(4);
      expect(room.spots.filter((s) => s.kind === 'stand').length).toBeGreaterThanOrEqual(3);
      expect(room.spots.filter((s) => s.kind === 'switch')).toHaveLength(1);
      for (const kind of ['whiteboard', 'sign', 'light_switch'] as const) expect(room.wallItems.some((w) => w.kind === kind), kind).toBe(true);
      // a cenografia nórdica: fogueira e suporte de armas
      expect(room.furniture.some((f) => f.kind === 'hearth')).toBe(true);
      expect(room.furniture.some((f) => f.kind === 'weapon_rack')).toBe(true);
    }
  });

  it('quem abre a sala decide a cara: poço do Mímir, tear da Frigg, e os mesmos lugares da sala padrão', () => {
    const room = (owner?: string) => asgardPlan.room({ id: '/proj/x', slot: 4, seed: 4242 }, theme, owner);
    const places = (a: AreaLayout) => a.spots.map((s) => `${s.kind}@${s.tx},${s.ty}`).sort();
    const base = room();
    for (const [owner, center] of [
      ['mimir', 'well'],
      ['frigg', 'loom'],
    ] as const) {
      const own = room(owner);
      expect(places(own), owner).toEqual(places(base));
      expect(own.furniture.some((f) => f.kind === center), owner).toBe(true);
      expect(own.furniture.some((f) => f.kind === 'hearth'), owner).toBe(false);
    }
    // os demais (Odin, sem --agent) ficam com a sala de sempre
    expect(room('odin').furniture.some((f) => f.kind === 'hearth')).toBe(true);
    expect(places(room('odin'))).toEqual(places(base));
  });
});

describe('Asgard: áreas fixas e rodas sociais', () => {
  const fixed = asgardFixedAreas();
  const area = (id: string) => fixed.find((a) => a.id === id)!;

  it('os papéis apontam para áreas fixas', () => {
    const { lobby, arrival, kitchen, leisure, restroom, brand } = asgardPlan.roles;
    for (const id of [lobby, arrival, kitchen, leisure, restroom, brand]) expect(fixed.some((a) => a.id === id)).toBe(true);
    expect(Object.keys(asgardPlan.roles.names).sort()).toEqual([BATH_ID, HALL_ID, KITCHEN_ID, THRONE_ID].sort());
  });

  it('a cozinha tem os mesmos assentos da copa (papo em pares), só que em outro lugar', () => {
    const rel = (a: AreaLayout) => a.spots.filter((s) => s.kind === 'cafe_seat').map((s) => [s.tx - a.rect.x, s.ty - a.rect.y, s.dir]);
    expect(rel(area(KITCHEN_ID))).toEqual(rel(layoutCafe()));
  });

  it('o banheiro tem pias vizinhas e o salão tem sofá com assentos vizinhos e TV', () => {
    const sinks = area(BATH_ID).spots.filter((s) => s.kind === 'sink').map((s) => s.tx);
    expect(sinks).toEqual([sinks[0], sinks[0] + 1, sinks[0] + 2]);
    const hall = area(HALL_ID);
    const sofa = hall.spots.filter((s) => s.kind === 'sofa').map((s) => s.tx);
    expect(sofa).toEqual([sofa[0], sofa[0] + 1, sofa[0] + 2]);
    expect(hall.wallItems.some((w) => w.kind === 'tv')).toBe(true);
  });

  it('o trono fica no topo, centrado sobre as três colunas, e se liga ao salão por uma porta', () => {
    const throne = area(THRONE_ID).rect;
    expect(throne).toEqual({ x: COL_W, y: 0, w: COL_W, h: ROOM_H });
    const b = asgardPlan.assemble(1, []);
    // porta do trono (linha 11) e a passagem pela parede norte do salão (linhas 12-13)
    for (const y of [11, 12, 13]) for (const x of [throne.x + 7, throne.x + 8]) expect(b.grid.walkable(x, y), `${x},${y}`).toBe(true);
  });
});
