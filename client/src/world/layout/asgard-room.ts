// Sala de projeto de Asgard (16x12, mesmas paredes e porta da sala do Escritório): um salão de trabalho nórdico.
//
// Os lugares que a simulação usa são os mesmos (6 mesas face a face com ranking, assentos extras, pontos em pé,
// interruptor, quadro e placa); muda a cenografia: as mesas têm pergaminhos no lugar de monitores, o canto de
// reunião vira uma fogueira com banquetas em volta, e entram estandartes, escudos, barris, pedra rúnica, colunas
// de madeira e o suporte de armas. A semente espelha a sala e escolhe os enfeites.
//
// Quem abre a sala decide a cara dela: a do Mímir é de pedra, com o poço da sabedoria no lugar da fogueira; a da
// Frigg é clara e azulada, com o tear de nuvens e a roca. Os lugares continuam os mesmos.
import { FURNITURE, type Dir, type FloorKind, type FurnitureKind, type RoomTheme } from '../../art/api';
import { mulberry32 } from '../../../../shared/hash';
import { DOOR_W, DOOR_X, TILE } from '../constants';
import { AreaBuilder, type SpotOpts } from './builder';
import type { Side } from './geometry';
import type { RoomInput } from './room';
import type { AreaLayout, SpotDef, SpotKind, TileRect } from './types';

const BANNERS = ['red', 'blue', 'green', 'gold'] as const;
const SHIELDS = ['code', 'coffee', 'rocket', 'cat', 'bug', 'ship_it'] as const;
const FURS = ['#8a7a68', '#6b5a45', '#a39282', '#5c4d3d'] as const;

interface OwnRoom {
  floor: FloorKind;
  look: Pick<RoomTheme, 'carpet' | 'carpet2' | 'wall'>;
  /** No lugar da fogueira (2x2, com as banquetas em volta). */
  center: FurnitureKind;
  banner: (typeof BANNERS)[number];
  fur: string;
}

/** Salas próprias, pelo `--agent` de quem abriu a sala. */
const OWN_ROOMS: Readonly<Record<string, OwnRoom>> = {
  mimir: {
    floor: 'concrete',
    look: { carpet: '#6f8a84', carpet2: '#58726c', wall: { base: '#7a8784', trim: '#3f4b49', pattern: 'brick' } },
    center: 'well',
    banner: 'green',
    fur: '#55625f',
  },
  frigg: {
    floor: 'carpet',
    look: { carpet: '#a9b9ca', carpet2: '#94a7bb', wall: { base: '#b9c5d1', trim: '#6c7f94', pattern: 'wood_panel' } },
    center: 'loom',
    banner: 'blue',
    fur: '#dfe3e8',
  },
};

export function layoutAsgardRoom(room: RoomInput, roomTheme: RoomTheme, cell: { rect: TileRect; side: Side }, owner?: string): AreaLayout {
  const own = owner ? OWN_ROOMS[owner] : undefined;
  const theme: RoomTheme = own ? { ...roomTheme, ...own.look } : roomTheme;
  const { rect, side } = cell;
  const rng = mulberry32((room.seed ^ 0xa59a) >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];
  const b = new AreaBuilder(room.id, 'room', rect);
  const area = b.area;
  area.side = side;
  const north = side === 'north';
  const door = { lx: DOOR_X, w: DOOR_W };

  // ---- espelhamento (coordenadas locais pensadas com as mesas à esquerda e a fogueira à direita)
  const mir = rng() < 0.5;
  const fx = (lx: number, w = 1) => (mir ? 16 - lx - w : lx);
  const fdir = (d: Dir): Dir => (mir && (d === 'left' || d === 'right') ? (d === 'left' ? 'right' : 'left') : d);
  const fdx = (dx: number | undefined) => (dx === undefined ? undefined : mir ? -dx : dx);
  const furn = (kind: FurnitureKind, lx: number, ly: number, variant?: string, o: { dx?: number; order?: number; seat?: string } = {}) =>
    b.furn(kind, fx(lx, FURNITURE[kind].footprint.w), ly, variant, { ...o, dx: fdx(o.dx) });
  const spot = (kind: SpotKind, lx: number, ly: number, dir: Dir, o: SpotOpts = {}): SpotDef => b.spot(kind, fx(lx), ly, fdir(dir), { ...o, dx: fdx(o.dx) });
  const seat = (kind: SpotKind, fk: FurnitureKind, lx: number, ly: number, dir: Dir, variant?: string, o: SpotOpts & { order?: number } = {}): SpotDef =>
    b.seat(kind, fk, fx(lx), ly, fdir(dir), variant, { ...o, dx: fdx(o.dx) });
  const wallItem = (kind: FurnitureKind, cx: number, variant?: string, o: { ly?: number; on?: 'face' | 'south'; order?: number } = {}) => b.wall(kind, mir ? 16 - cx : cx, variant, o);
  const rug = (lx: number, ly: number, w: number, h: number, color: string, seed: number) => b.rug(fx(lx, w), ly, w, h, color, seed);

  // ---- piso de tábuas no tom da sala, peles sob as mesas e em volta da fogueira
  b.floor(own?.floor ?? 'carpet', 0, 0, 16, 12, room.seed, theme.carpet, theme.carpet2);
  area.floorTint = theme.carpet;
  rug(1.5, 3.25, 7, 5.5, theme.carpet2, room.seed);
  const centerFur = pick(FURS);
  rug(9.4, 3.4, 5.2, 5.2, own?.fur ?? centerFur, room.seed + 2);
  rug(DOOR_X - 0.25, north ? 9.5 : 2, DOOR_W + 0.5, 1.25, pick(FURS), room.seed + 1);

  // ---- paredes (as mesmas da sala do Escritório)
  if (north) {
    b.face(0.5, 15, theme.wall);
    b.south(0.5, 15, 11, theme.wall, [door]);
  } else {
    b.face(0.5, 15, theme.wall, [door]);
    b.south(0.5, 15, 11, { ...theme.wall, exterior: true });
    b.wall('door_frame', DOOR_X + DOOR_W / 2, undefined, { order: 0.05 });
  }
  b.cap(0, 0, 0.5, 12, theme.wall);
  b.cap(15.5, 0, 0.5, 12, theme.wall);

  // ---- caminhabilidade
  b.walk(1, 2, 14, 9);
  area.door = north ? { x: rect.x + DOOR_X, y: rect.y + 11, w: DOOR_W, h: 1 } : { x: rect.x + DOOR_X, y: rect.y, w: DOOR_W, h: 2 };
  b.walk(area.door.x - rect.x, area.door.y - rect.y, area.door.w, area.door.h);

  // ---- parede: placa entalhada, quadro de runas, disco de sol e lua, estandartes e escudo
  const signCx = north ? 8 : 10.5;
  area.signId = wallItem('sign', signCx, undefined, { order: 0.95 });
  const banner = own?.banner ?? pick(BANNERS);
  if (north) {
    wallItem('whiteboard', 4.5, undefined, { order: 0.6 });
    wallItem('banner', 14.6, banner, { order: 0.45 });
    wallItem('clock', 10.25, undefined, { order: 0.7 });
    wallItem('poster', 11.4, pick(SHIELDS), { order: 0.5 });
    wallItem('window', 13, undefined, { order: 0.4 });
    wallItem('light_switch', DOOR_X - 0.5, 'on', { ly: 12, on: 'south', order: 0.8 });
    spot('switch', DOOR_X - 1, 10, 'down', { dy: -1 });
  } else {
    wallItem('whiteboard', 2.5, undefined, { order: 0.6 });
    wallItem('light_switch', DOOR_X - 0.5, 'on', { order: 0.8 });
    wallItem('clock', 12.5, undefined, { order: 0.7 });
    wallItem('poster', 13.6, pick(SHIELDS), { order: 0.5 });
    wallItem('banner', 14.6, banner, { order: 0.46 });
    spot('switch', DOOR_X - 1, 2, 'up', { dy: -3 });
  }
  spot('whiteboard', north ? 4 : 2, 2, 'up', { dx: 8, dy: 2 });

  // ---- mesas de pergaminho face a face (colunas 2–7, linhas 4–7): o mesmo contrato da ilha do Escritório
  const ranks = [2, 0, 4];
  for (let i = 0; i < 3; i++) {
    const lx = 2 + i * 2;
    const back = furn('desk_back', lx, 5, theme.deskVariant, { order: 0.35 + i * 0.05, seat: `N${i}` });
    const front = furn('desk', lx, 6, theme.deskVariant, { order: 0.4 + i * 0.05, seat: `S${i}` });
    seat('desk', 'office_chair_front', lx, 4, 'down', theme.chairVariant, { dx: TILE / 2, deskId: back, rank: ranks[i] + 1, side: 'N', order: 0.55 + i * 0.03 });
    seat('desk', 'office_chair', lx, 7, 'up', theme.chairVariant, { dx: TILE / 2, deskId: front, rank: ranks[i], side: 'S', order: 0.6 + i * 0.03 });
  }

  // ---- a fogueira (ou o poço, ou o tear), com banquetas em volta (os lugares extras dos subagentes)
  furn(own?.center ?? 'hearth', 11, 5, undefined, { order: 0.45 });
  seat('stool', 'stool', 10, 5, 'right', undefined, { order: 0.65 });
  seat('stool', 'stool', 13, 6, 'left', undefined, { order: 0.66 });
  seat('stool', 'stool', 11, 4, 'down', undefined, { order: 0.67 });
  seat('stool', 'stool', 12, 7, 'up', undefined, { order: 0.68 });

  // ---- apoio junto às paredes: estante de pergaminhos, barril, pedra rúnica e braseiro
  const shelfX = north ? 1 : 4;
  furn('bookshelf', shelfX, 2, undefined, { order: 0.25 });
  spot('shelf', shelfX, 3, 'up', { dx: 8, dy: -2 });
  if (owner === 'mimir') furn('runestone', 14, 2, undefined, { order: 0.2 });
  else if (owner === 'frigg') furn('plant_small', 14, 2, 'flower', { order: 0.2 });
  else furn('barrel', 14, 2, undefined, { order: 0.2 });
  if (north) spot('window', 12, 2, 'up', { dx: 12, dy: 1 });
  else furn('runestone', 1, 2, undefined, { order: 0.22 });
  furn('pillar', 14, 4, undefined, { order: 0.3 });
  furn('floor_lamp', 14, 8, undefined, { order: 0.34 });

  // ---- cantos de baixo (linhas 9–10; a passagem da porta, colunas 6–9, fica livre)
  // esquerda: peles para sentar e um barril; direita: o suporte de armas e a mesa alta de quem trabalha em pé
  rug(1.5, 8.85, 4, 2, pick(FURS), room.seed + 3);
  seat('nook', 'beanbag', 2, 10, 'up', pick(['red', 'blue', 'yellow', 'green']), { order: 0.6 });
  seat('nook', 'beanbag', 4, 10, 'up', pick(['red', 'blue', 'yellow', 'green']), { order: 0.61 });
  furn('barrel', 1, 10, undefined, { order: 0.2 });
  furn('runestone', 5, 10, undefined, { order: 0.21 });
  // no canto: o suporte de armas; na sala do Mímir, mais pergaminhos; na da Frigg, a roca e flores
  if (owner === 'mimir') furn('bookshelf', 13, 10, undefined, { order: 0.25 });
  else if (owner === 'frigg') {
    furn('spinning_wheel', 13, 10, undefined, { order: 0.25 });
    furn('plant_small', 14, 10, 'flower', { order: 0.255 });
  } else furn('weapon_rack', 13, 10, undefined, { order: 0.25 });
  furn('cafe_table', 11, 10, undefined, { order: 0.26 });
  spot('stand', 11, 9, 'down', { dy: -1 });

  // pontos em pé (subagentes sem lugar sentado trabalham aqui; também servem de conversa)
  spot('stand', 9, 3, 'left');
  spot('stand', 1, 7, 'right');
  spot('stand', 13, 9, 'up', { dy: -2 });

  // ---- sombreamento quando a luz está apagada (salas ao norte: a mureta sul fica clara)
  const p = { x: rect.x * TILE, y: rect.y * TILE, w: rect.w * TILE, h: rect.h * TILE };
  area.shade = north ? { x: p.x, y: p.y, w: p.w, h: p.h - TILE } : { x: p.x, y: p.y, w: p.w, h: p.h };
  return b.build();
}
