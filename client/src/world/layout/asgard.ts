// Planta de Asgard: a sala do trono de Odin no topo (é por ela, pela Bifrost, que todos chegam e vão embora),
// a fileira fixa com cozinha, salão e banheiro, e as salas de projeto em fileiras de 3 que crescem para baixo.
//
//              [   Trono   ]
//   [Cozinha ][  Salão    ][Banheiro ]      faixa 0: fileira fixa
//   ===========corredor 0===========░  rua
//   [ vaga 0 ][  vaga 1   ][ vaga 2  ]░  de pedra, por fora, ligando
//   [ vaga 3 ][  vaga 4   ][ vaga 5  ]░  as saídas dos corredores
//   ===========corredor 1===========░  e seguindo para o sul
//   [ vaga 6 ][  vaga 7   ][ vaga 8  ]░
//
// Cada faixa tem 29 tiles (sala, corredor, sala), como a coluna do Escritório deitada; as salas de projeto são as
// mesmas 16x12 (layoutProjectRoom), com a porta para o corredor da faixa. Vaga vazia é jardim: a sala nasce quando
// o projeto abre, e o prédio cresce para baixo com elas.
import { TILE } from '../../art/api';
import type { WallStyle } from '../../art/api';
import { mulberry32 } from '../../../../shared/hash';
import { COL_W, CORRIDOR_H, EXT_NORTH, EXT_SOUTH, ROOM_H } from '../constants';
import { WalkGrid } from '../path/grid';
import { AreaBuilder, SEAT_FOOT_DY, SEATED_SORT_BIAS } from './builder';
import { paintArea, type BuildingLayout } from './building';
import { layoutCafe } from './core';
import type { ExteriorLayout, SlotShell } from './exterior';
import type { Side } from './geometry';
import type { BuildingPlan } from './plan';
import { layoutAsgardRoom } from './asgard-room';
import type { AreaLayout, ExteriorProp, FloorPatch, TileRect } from './types';

export const THRONE_ID = 'asgard:trono';
export const KITCHEN_ID = 'asgard:cozinha';
export const HALL_ID = 'asgard:salao';
export const BATH_ID = 'asgard:banheiro';

/** Salas por fileira. */
const COLS = 3;
/** Largura das salas lado a lado (é onde terminam os corredores). */
const ROOMS_W = COLS * COL_W;
/** Faixa da rua de pedra, a leste das salas (3 de calçamento + 2 de grama). */
const ROAD_W = 5;
const ROAD_PAVED = 3;
/** Largura do prédio com a rua (tiles). */
const W = ROOMS_W + ROAD_W;
/** Faixa: fileira de cima + corredor + fileira de baixo. */
const BAND_H = ROOM_H * 2 + CORRIDOR_H;
/** Vagas na faixa 0 (só a fileira de baixo: a de cima é fixa) e nas demais. */
const FIRST_BAND_SLOTS = COLS;
const BAND_SLOTS = COLS * 2;

/** Topo da faixa `k` (a sala do trono ocupa as primeiras ROOM_H linhas). */
const bandTop = (k: number) => ROOM_H + k * BAND_H;
const corridorId = (k: number) => `asgard:corredor:${k}`;
const ROAD_ID = 'asgard:rua';

/** Centros (tiles locais) dos dois feixes da Bifrost na parede norte do trono. */
const BIFROST_CX = [2.5, 5.5] as const;
/** Trono (2x1, tiles locais da sala do trono). */
const THRONE_LX = 7;
const THRONE_LY = 2;

const WALLS = {
  throne: { base: '#8f8a83', trim: '#5e564c', pattern: 'brick' } satisfies WallStyle,
  hall: { base: '#9a7552', trim: '#5f4329', pattern: 'wood_panel' } satisfies WallStyle,
  bath: { base: '#a7b3b5', trim: '#66757a', pattern: 'tiles' } satisfies WallStyle,
  outside: { base: '#a39a8c', trim: '#6b6152', pattern: 'brick', exterior: true } satisfies WallStyle,
};

export function bandOf(slot: number): number {
  const s = Math.max(0, Math.floor(slot));
  return s < FIRST_BAND_SLOTS ? 0 : 1 + Math.floor((s - FIRST_BAND_SLOTS) / BAND_SLOTS);
}

/** Vaga -> retângulo e lado do corredor. Numeradas faixa a faixa, de cima para baixo, da esquerda para a direita. */
export function asgardCell(slot: number): { rect: TileRect; side: Side } {
  const s = Math.max(0, Math.floor(slot));
  if (s < FIRST_BAND_SLOTS) return { rect: { x: s * COL_W, y: bandTop(0) + ROOM_H + CORRIDOR_H, w: COL_W, h: ROOM_H }, side: 'south' };
  const k = bandOf(s);
  const i = (s - FIRST_BAND_SLOTS) % BAND_SLOTS;
  const side: Side = i < COLS ? 'north' : 'south';
  const y = side === 'north' ? bandTop(k) : bandTop(k) + ROOM_H + CORRIDOR_H;
  return { rect: { x: (i % COLS) * COL_W, y, w: COL_W, h: ROOM_H }, side };
}

const slotsFor = (bands: number) => FIRST_BAND_SLOTS + BAND_SLOTS * (bands - 1);

function rectFor(bands: number): TileRect {
  return { x: 0, y: 0, w: W, h: bandTop(Math.max(1, bands)) };
}

// ------------------------------------------------------------------ áreas fixas

function layoutThrone(): AreaLayout {
  const b = new AreaBuilder(THRONE_ID, 'reception', { x: COL_W, y: 0, w: COL_W, h: ROOM_H });
  const wall = WALLS.throne;
  b.floor('marble', 0, 0, 16, 12, 601);
  // tapete do trono até a porta do salão
  b.rug(7, 3.4, 2, 8.6, '#8c2131', 602);
  b.face(0.5, 15, wall);
  b.cap(0, 0, 0.5, 12, wall);
  b.cap(15.5, 0, 0.5, 12, wall);
  b.south(0.5, 15, 11, wall, [{ lx: 7, w: 2 }]);
  b.walk(1, 2, 14, 9);
  b.walk(7, 11, 2, 1);

  // Bifrost: os pontos de chegada e saída de todo mundo, a oeste do trono
  BIFROST_CX.forEach((cx, i) => {
    b.wall('elevator', cx, undefined, { order: 0.2 + i * 0.1 });
    b.spot('elevator', Math.floor(cx - 0.5), 2, 'up', { x: b.px(cx), y: b.py(2) + 2, group: `elevator:${i}` });
  });
  // o trono, no alto da sala, de frente para a porta (o Odin senta nele: ver `npcs` do plano), com os lobos
  // Geri e Freki deitados aos pés e braseiros dos lados
  b.furn('throne', THRONE_LX, THRONE_LY, undefined, { order: 0.4 });
  b.furn('wolf', THRONE_LX - 1, THRONE_LY + 1, 'right', { order: 0.43 });
  b.furn('wolf', THRONE_LX + 2, THRONE_LY + 1, 'left', { order: 0.44 });
  b.furn('floor_lamp', THRONE_LX + 2, THRONE_LY, undefined, { order: 0.42 });
  b.wall('banner', 9.5, 'gold', { order: 0.5 });
  b.wall('sign', 12, undefined, { order: 0.9 });
  b.wall('banner', 14.5, 'red', { order: 0.51 });
  // colunas de madeira ao longo do salão e braseiros nos cantos
  for (const ly of [5, 8]) {
    b.furn('pillar', 1, ly, undefined, { order: 0.2 });
    b.furn('pillar', 14, ly, undefined, { order: 0.21 });
  }
  b.furn('floor_lamp', 1, 10, undefined, { order: 0.23 });
  b.furn('floor_lamp', 14, 10, undefined, { order: 0.24 });
  b.furn('runestone', 14, 2, undefined, { order: 0.25 });
  // banco de espera (quem ainda não tem sala fica por aqui)
  const bench = b.furn('bench', 11, 8, undefined, { order: 0.5 });
  for (let i = 0; i < 2; i++) b.seat('bench', 'bench', 11 + i, 8, 'down', undefined, { noFurniture: true, furnitureId: bench });
  b.spot('talk', 3, 8, 'right', { group: 'talk:trono', dx: -1 });
  b.spot('talk', 4, 8, 'left', { group: 'talk:trono', dx: 1 });
  const a = b.build();
  a.shade = undefined;
  return a;
}

/** Salão (lazer): porta para o trono no meio da parede norte e aberto para o corredor ao sul. */
function layoutHall(): AreaLayout {
  const b = new AreaBuilder(HALL_ID, 'lounge', { x: COL_W, y: bandTop(0), w: COL_W, h: ROOM_H });
  const wall = WALLS.hall;
  b.floor('wood', 0, 0, 16, 12, 611);
  b.rug(0.8, 3.2, 6.6, 4.6, '#7d5a2e', 612);
  b.face(0.5, 15, wall, [{ lx: 7, w: 2 }]);
  b.wall('door_frame', 8, undefined, { order: 0.05 });
  b.cap(0, 0, 0.5, 12, wall);
  b.cap(15.5, 0, 0.5, 12, wall);
  b.walk(1, 2, 14, 10);
  b.walk(7, 0, 2, 2);

  b.wall('tv', 3.5, undefined, { order: 0.4 });
  b.wall('banner', 5.75, 'blue', { order: 0.45 });
  b.wall('banner', 10, 'green', { order: 0.46 });
  b.wall('painting', 12.25, undefined, { order: 0.5 });
  // a fogueira do salão, no meio (quem vem do trono contorna pelos lados)
  b.furn('hearth', 7, 7, undefined, { order: 0.48 });
  // sofá de costas para a câmera, de frente para a TV; poltronas dos lados (TV e videogame usam assentos vizinhos)
  const sofa = b.furn('sofa', 2, 6, 'up', { order: 0.5 });
  for (let i = 0; i < 3; i++) b.seat('sofa', 'sofa', 2 + i, 6, 'up', 'up', { noFurniture: true, furnitureId: sofa });
  b.furn('coffee_table', 2, 4, undefined, { dx: TILE / 2, order: 0.45 });
  b.block(4, 4, 1, 1);
  b.seat('armchair', 'armchair', 1, 4, 'right', 'right', { order: 0.55 });
  b.seat('armchair', 'armchair', 5, 4, 'left', 'left', { order: 0.56 });

  // ping-pong (jogadores nas pontas oeste/leste)
  b.furn('pingpong_table', 9, 5, undefined, { order: 0.4 });
  const ppY = b.py(6) + 5;
  const ppSort = b.py(7) + SEATED_SORT_BIAS;
  b.spot('pingpong', 8, 6, 'right', { x: b.px(9) - 8, y: ppY, group: 'pingpong', sortY: ppSort });
  b.spot('pingpong', 12, 6, 'left', { x: b.px(12) + 8, y: ppY, group: 'pingpong', sortY: ppSort });
  b.spot('watch', 9, 4, 'down', { group: 'watch:pingpong', dx: 2 });
  b.spot('watch', 11, 4, 'down', { group: 'watch:pingpong', dx: -2 });

  for (const lx of [13, 14]) {
    b.furn('arcade', lx, 2, undefined, { order: 0.3 });
    b.spot('arcade', lx, 3, 'up', { dy: -3 });
  }
  b.furn('floor_lamp', 6, 2, undefined, { order: 0.32 });
  (['red', 'blue'] as const).forEach((c, i) => b.seat('beanbag', 'beanbag', 1 + i * 2, 9, 'down', c, { order: 0.6 + i * 0.02 }));
  b.spot('talk', 10, 9, 'right', { group: 'talk:salao', dx: -1 });
  b.spot('talk', 11, 9, 'left', { group: 'talk:salao', dx: 1 });
  // aberto para o corredor, com divisórias nas pontas
  for (const lx of [1, 2, 3, 4, 5, 11, 12, 13, 14]) b.furn('glass_partition', lx, 11, 'h', { order: 0.15 });
  return b.build();
}

/** Banheiro: pias lado a lado (o espelho das rodas usa pias vizinhas) e cabines; porta para o corredor ao sul. */
function layoutBath(): AreaLayout {
  const b = new AreaBuilder(BATH_ID, 'restroom', { x: 2 * COL_W, y: bandTop(0), w: COL_W, h: ROOM_H });
  const wall = WALLS.bath;
  b.floor('tile_white', 0, 0, 16, 12, 621);
  b.rug(2, 3.15, 3, 0.85, '#6fa3b8', 622);
  b.face(0.5, 15, wall);
  b.cap(0, 0, 0.5, 12, wall);
  b.cap(15.5, 0, 0.5, 12, wall);
  b.south(0.5, 15, 11, wall, [{ lx: 7, w: 2 }]);
  b.walk(1, 2, 14, 9);
  b.walk(7, 11, 2, 1);

  for (let i = 0; i < 3; i++) {
    b.wall('mirror', 2.5 + i, undefined, { order: 0.3 });
    b.furn('sink', 2 + i, 2, undefined, { order: 0.35 });
    b.spot('sink', 2 + i, 3, 'up', { dy: -3 });
  }
  b.furn('barrel', 5, 2, undefined, { order: 0.4 });
  b.furn('runestone', 1, 2, undefined, { order: 0.2 });
  b.wall('clock', 6, undefined, { order: 0.5 });
  for (let i = 0; i < 3; i++) {
    const lx = 9 + i * 2;
    const stall = b.furn('toilet_stall', lx, 2, undefined, { order: 0.3 + i * 0.05 });
    b.spot('stall', lx, 4, 'up', { furnitureId: stall, x: b.px(lx + 1), y: b.py(4) - 3, sortY: b.py(4) - 0.5 });
  }
  const bench = b.furn('bench', 3, 8, undefined, { order: 0.5 });
  for (let i = 0; i < 2; i++) b.seat('bench', 'bench', 3 + i, 8, 'down', undefined, { noFurniture: true, furnitureId: bench });
  b.furn('floor_lamp', 1, 9, undefined, { order: 0.21 });
  b.furn('barrel', 14, 9, undefined, { order: 0.22 });
  b.furn('barrel', 14, 6, undefined, { order: 0.2 });
  return b.build();
}

/** Cozinha: a disposição da copa (os assentos das rodas de papo), com barris no lugar dos vasos de planta. */
function layoutKitchen(): AreaLayout {
  const a = layoutCafe(KITCHEN_ID, { x: 0, y: bandTop(0), w: COL_W, h: ROOM_H });
  for (const f of a.furniture) {
    if (f.kind === 'plant_tall' || f.kind === 'plant_small') {
      f.kind = 'barrel';
      f.variant = undefined;
    }
  }
  return a;
}

/** Corredor da faixa `k`, da largura das salas: fechado a oeste e com a saída para a rua a leste. */
function layoutBandCorridor(k: number): AreaLayout {
  const id = corridorId(k);
  const b = new AreaBuilder(id, 'corridor', { x: 0, y: bandTop(k) + ROOM_H, w: ROOMS_W, h: CORRIDOR_H });
  b.floor('concrete', 0, 0, ROOMS_W, CORRIDOR_H, 631 + k);
  for (let ly = 0; ly < CORRIDOR_H; ly++) {
    const edge = ly === 0 || ly === CORRIDOR_H - 1;
    b.furn('glass_partition', 0, ly, edge ? 'end' : 'v', { order: 0.1 });
    if (edge) b.furn('glass_partition', ROOMS_W - 1, ly, 'end', { order: 0.1 });
  }
  b.walk(1, 0, ROOMS_W - 1, CORRIDOR_H);
  for (let c = 0; c < COLS; c++) {
    const x = c * COL_W;
    b.rug(x + 2, 1.95, COL_W - 4, 1.1, '#8a6a46', 640 + k * COLS + c);
    b.spot('talk', x + 5, 2, 'right', { group: `talk:${id}:${c}`, dx: -1 });
    b.spot('talk', x + 6, 2, 'left', { group: `talk:${id}:${c}`, dx: 1 });
    // braseiros e barris alternados; colunas de madeira onde as paredes das salas se encontram
    if (c !== 1) b.furn((k + c) % 2 === 0 ? 'floor_lamp' : 'barrel', x + 13, 4, undefined, { order: 0.5 });
    if (c < COLS - 1) {
      b.furn('pillar', x + 15, 0, undefined, { order: 0.4 });
      b.furn('pillar', x + 15, CORRIDOR_H - 1, undefined, { order: 0.41 });
    }
  }
  return b.build();
}

/** Topo do corredor da primeira faixa e base do corredor da última: o trecho caminhável da rua. */
const roadSpan = (bands: number) => ({ y0: bandTop(0) + ROOM_H, y1: bandTop(bands - 1) + ROOM_H + CORRIDOR_H });

/** Rua de pedra do lado de fora, a leste: liga as saídas dos corredores (o resto dela, ao sul, é cenário). */
function layoutRoad(bands: number): AreaLayout {
  const { y0, y1 } = roadSpan(bands);
  const b = new AreaBuilder(ROAD_ID, 'corridor', { x: ROOMS_W, y: y0, w: ROAD_W, h: y1 - y0 });
  b.floor('sidewalk', 0, 0, ROAD_PAVED, y1 - y0, 680);
  b.walk(0, 0, ROAD_PAVED, y1 - y0);
  const a = b.build();
  a.shade = undefined;
  return a;
}

let fixedCache: AreaLayout[] | null = null;
const corridorCache = new Map<number, AreaLayout>();
const roadCache = new Map<number, AreaLayout>();

/** Trono, cozinha, salão e banheiro (calculados uma vez). */
export function asgardFixedAreas(): AreaLayout[] {
  return (fixedCache ??= [layoutThrone(), layoutKitchen(), layoutHall(), layoutBath()]);
}

function corridorAt(k: number): AreaLayout {
  let a = corridorCache.get(k);
  if (!a) corridorCache.set(k, (a = layoutBandCorridor(k)));
  return a;
}

function roadFor(bands: number): AreaLayout {
  let a = roadCache.get(bands);
  if (!a) roadCache.set(bands, (a = layoutRoad(bands)));
  return a;
}

function assemble(bands: number, rooms: readonly AreaLayout[], version = 0): BuildingLayout {
  const n = Math.max(1, bands);
  const extra: AreaLayout[] = [];
  for (let k = 1; k < n; k++) extra.push(corridorAt(k));
  extra.push(roadFor(n));
  const core = [...asgardFixedAreas(), ...extra];
  const corridor = corridorAt(0);
  const rect = rectFor(n);
  const grid = new WalkGrid(rect.w, rect.h, version);
  const all = [...core, corridor, ...rooms];
  for (const a of all) paintArea(grid, a);
  return { cols: n, rect, core, corridor, rooms: [...rooms], grid, spots: all.flatMap((a) => a.spots) };
}

// ------------------------------------------------------------------ fora das salas

/**
 * Vaga vazia: jardim do lado de fora, com a parede que fecha o corredor (fachada com janelas ao norte dele,
 * mureta ao sul). A sala nasce ali quando um projeto abre; os enfeites do jardim somem com ela.
 */
function emptySlot(slot: number): SlotShell {
  const { rect, side } = asgardCell(slot);
  const x0 = rect.x * TILE;
  const w = rect.w * TILE;
  const T = (n: number) => n * TILE;
  const rng = mulberry32(0x5107 + slot * 31);
  const seed = () => Math.floor(rng() * 1e9);
  const walls: SlotShell['walls'] = [];
  const windows: SlotShell['windows'] = [];
  const props: ExteriorProp[] = [];
  const shell: SlotShell = { slot, rect, side, walls, windows, floors: [], props };
  // jardim: pinheiros nas pontas, pedras e flores no meio (o lado do corredor fica livre)
  const top = side === 'north' ? 1 : 3;
  props.push({ kind: 'snowpine', x: x0 + T(2) + 4, y: T(rect.y + top + 3), seed: seed(), slot });
  props.push({ kind: rng() < 0.5 ? 'snowpine' : 'pine', x: x0 + T(14) - 4, y: T(rect.y + top + 4), seed: seed(), slot });
  props.push({ kind: rng() < 0.5 ? 'runestone' : 'boulder', x: x0 + T(6), y: T(rect.y + top + 3), seed: seed(), slot });
  props.push({ kind: 'bush', x: x0 + T(10), y: T(rect.y + top + 6), seed: seed(), slot });
  for (const cx of [4, 8, 12]) props.push({ kind: 'flowers', x: x0 + T(cx), y: T(rect.y + top + 1 + (cx % 3)), seed: slot * 3 + cx, slot });
  if (side === 'north') {
    const fy = T(rect.y + ROOM_H - 2);
    walls.push({ kind: 'face', x: x0, y: fy, w, style: WALLS.outside });
    [3, 8, 13].forEach((cx, i) =>
      windows.push({ id: `shell:${slot}:janela${i}`, kind: 'window', cx: x0 + T(cx), baseY: T(rect.y + ROOM_H), on: 'face', order: 0 }),
    );
    shell.sun = { x: rect.x, y: rect.y + ROOM_H, w: rect.w, h: CORRIDOR_H };
  } else {
    walls.push({ kind: 'south', x: x0, y: T(rect.y), w, style: WALLS.outside });
  }
  return shell;
}

/**
 * Terreno de cada lado do prédio (tiles). O prédio é alto e estreito, e a visão inicial mostra muito dos lados:
 * com a margem do Escritório, a borda do terreno aparecia na tela.
 */
const EXT_SIDE = 40;

/** Terreno em volta do salão: gramado com pinheiros, árvores e pedras, e a rua de pedra seguindo para o sul. */
function exteriorFor(bands: number): ExteriorLayout {
  const r = rectFor(bands);
  const bounds: TileRect = { x: -EXT_SIDE, y: -EXT_NORTH, w: r.w + 2 * EXT_SIDE, h: r.h + EXT_NORTH + EXT_SOUTH };
  const px = (t: number) => t * TILE;
  const rng = mulberry32(0xa5ad + bands);
  const props: ExteriorProp[] = [];
  const seed = () => Math.floor(rng() * 1e9);
  const tree = (tx: number, ty: number) => {
    const r = rng();
    props.push({ kind: r < 0.62 ? 'snowpine' : r < 0.9 ? 'pine' : 'boulder', x: px(tx) + Math.floor(rng() * 8), y: px(ty) + Math.floor(rng() * 8), seed: seed() });
  };
  // bosque em volta do prédio: uma árvore em metade das células de 5x4 tiles (a rua passa livre ao sul)
  const onRoad = (tx: number) => tx >= ROOMS_W - 1 && tx <= ROOMS_W + ROAD_PAVED;
  const nearBuilding = (tx: number, ty: number) => tx >= -2 && tx < r.w + 2 && ty >= -2 && ty < r.h + 2;
  for (let cy = bounds.y + 2; cy < bounds.y + bounds.h - 2; cy += 4) {
    for (let cx = bounds.x + 2; cx < bounds.x + bounds.w - 2; cx += 5) {
      const tx = cx + Math.floor(rng() * 4);
      const ty = cy + Math.floor(rng() * 3);
      if (rng() < 0.5 || nearBuilding(tx, ty) || (ty >= r.h && onRoad(tx))) continue;
      tree(tx, ty);
    }
  }
  // os dois gramados ao lado da sala do trono
  for (const [x0, x1] of [
    [1, COL_W - 1],
    [2 * COL_W + 1, W - 1],
  ] as const) {
    for (let tx = x0; tx < x1; tx += 4) {
      if (rng() < 0.55) tree(tx, 2 + Math.floor(rng() * 7));
      else props.push({ kind: rng() < 0.5 ? 'runestone' : 'boulder', x: px(tx) + 4, y: px(4 + Math.floor(rng() * 6)), seed: seed() });
    }
  }
  const floors: FloorPatch[] = [{ kind: 'grass', x: px(bounds.x), y: px(bounds.y), w: px(bounds.w), h: px(bounds.h), seed: 21 }];
  // a rua continua da saída do último corredor até o fim do terreno, ao sul, marcada por pedras rúnicas
  const { y0, y1 } = roadSpan(bands);
  for (let ty = y0 + 3; ty < bounds.y + bounds.h - 2; ty += 7) props.push({ kind: 'runestone', x: px(ROOMS_W + ROAD_PAVED) + 10, y: px(ty), seed: seed() });
  floors.push({ kind: 'sidewalk', x: px(ROOMS_W), y: px(y1), w: px(ROAD_PAVED), h: px(bounds.y + bounds.h - y1), seed: 681 });
  return { bounds, floors, props, lanes: [], streetY: 0, streetH: 0 };
}

export const asgardPlan: BuildingPlan = {
  id: 'asgard',
  cell: asgardCell,
  extentFor(slots) {
    let k = 0;
    for (const s of slots) k = Math.max(k, bandOf(s));
    return k + 1;
  },
  rectFor,
  assemble,
  room: (input, theme, owner) => layoutAsgardRoom(input, theme, asgardCell(input.slot), owner),
  outside(bands) {
    const n = Math.max(1, bands);
    const shells: SlotShell[] = [];
    for (let slot = 0; slot < slotsFor(n); slot++) shells.push(emptySlot(slot));
    return { exterior: exteriorFor(n), shells, street: false, glows: [] };
  },
  cameraPad: { left: 7, top: 6, right: 7, bottom: 12 },
  roles: {
    lobby: THRONE_ID,
    arrival: THRONE_ID,
    kitchen: KITCHEN_ID,
    leisure: HALL_ID,
    restroom: BATH_ID,
    brand: THRONE_ID,
    brandName: 'Asgard',
    names: { [THRONE_ID]: 'Trono de Odin', [KITCHEN_ID]: 'Cozinha', [HALL_ID]: 'Salão', [BATH_ID]: 'Banheiro' },
  },
  // o Odin de verdade, sentado no trono (as sessões `claude --agent odin` são hologramas dele)
  npcs: [
    {
      id: 'odin',
      agent: 'odin:trono',
      seed: 1,
      x: (COL_W + THRONE_LX + 1) * TILE,
      y: (THRONE_LY + 1) * TILE - SEAT_FOOT_DY,
      sortY: (THRONE_LY + 1) * TILE + SEATED_SORT_BIAS,
      dir: 'down',
      pose: 'sit',
    },
  ],
  bucketOf(tx, ty) {
    if (ty < ROOM_H) return 'trono';
    const k = Math.floor((ty - ROOM_H) / BAND_H);
    const ly = ty - bandTop(k);
    const part = ly < ROOM_H ? 'n' : ly < ROOM_H + CORRIDOR_H ? 'c' : 's';
    return `${Math.min(Math.floor(tx / COL_W), COLS)}:${k}:${part}`;
  },
};
