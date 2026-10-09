// Plano do prédio: o que o tema decide sobre a planta (áreas fixas, onde fica cada vaga de sala, exterior
// e o papel de cada área). O mundo só conversa com o prédio por aqui; o Escritório é o `officePlan`.
import type { RoomTheme } from '../../art/api';
import { COL_W, CORE_COLS, CORRIDOR_H, CORRIDOR_Y, SOUTH_Y, TILE } from '../constants';
import { assembleBuilding, type BuildingLayout } from './building';
import { CAFE_ID, LOUNGE_ID, RECEPTION_ID, RESTROOM_ID } from './core';
import { layoutExterior, slotShell, type ExteriorLayout, type SlotShell } from './exterior';
import { buildingRect, columnsFor, slotAt, slotRect, slotSide, type Side } from './geometry';
import { layoutProjectRoom, type RoomInput } from './room';
import type { AreaLayout, TileRect } from './types';

/** Áreas com papel fixo na vida do escritório (ids de áreas fixas do plano). */
export interface PlanRoles {
  /** Onde espera quem ainda não tem sala. */
  lobby: string;
  /** Área com os pontos de chegada e saída (spots `elevator` e itens de parede `elevator`, na mesma ordem). */
  arrival: string;
  /** Rodas de papo (pares de `cafe_seat`). */
  kitchen: string;
  /** TV e videogame (sofás e poltronas vizinhos). */
  leisure: string;
  /** Espelho (pias lado a lado). */
  restroom: string;
  /** Área com a placa da marca. */
  brand: string;
  /** Texto da placa da marca. */
  brandName: string;
  /** Nome exibido de cada área fixa (pílulas e falas das rodas). */
  names: Readonly<Record<string, string>>;
}

/** Brilho noturno de uma fachada (px de mundo): centro, tamanho e intensidade. */
export interface FacadeGlow {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
}

/** Tudo o que fica fora das salas: terreno, cascas das vagas vazias e detalhes da entrada. */
export interface PlanOutside {
  exterior: ExteriorLayout;
  shells: SlotShell[];
  /** Faixas tracejadas da rua. */
  street: boolean;
  /** Capacho diante da entrada (px de mundo). */
  doormat?: { x: number; y: number; w: number; h: number };
  glows: FacadeGlow[];
}

export interface BuildingPlan {
  readonly id: string;
  /** Retângulo e lado do corredor de uma vaga. Vaga maior = mais longe das áreas fixas. */
  cell(slot: number): { rect: TileRect; side: Side };
  /** Tamanho do prédio para as vagas em uso (número opaco: colunas no Escritório). */
  extentFor(slots: Iterable<number>): number;
  /** Retângulo (tiles) do prédio para um tamanho. */
  rectFor(extent: number): TileRect;
  assemble(extent: number, rooms: readonly AreaLayout[], version?: number): BuildingLayout;
  /** Layout de uma sala de projeto; `owner` = o agente (`claude --agent`) de quem abriu a sala. */
  room(input: RoomInput, theme: RoomTheme, owner?: string): AreaLayout;
  outside(extent: number): PlanOutside;
  /** Margens da câmera em volta do prédio (tiles). */
  readonly cameraPad: { left: number; top: number; right: number; bottom: number };
  readonly roles: PlanRoles;
  /** Grupo de um tile para racionar balões na visão geral (uma sala, um trecho do corredor...). */
  bucketOf(tx: number, ty: number): string;
}

export const officePlan: BuildingPlan = {
  id: 'escritorio',
  cell: (slot) => ({ rect: slotRect(slot), side: slotSide(slot) }),
  extentFor: columnsFor,
  rectFor: buildingRect,
  assemble: assembleBuilding,
  room: (input, theme) => layoutProjectRoom(input, theme),
  outside(cols) {
    const shells: SlotShell[] = [];
    for (let col = CORE_COLS; col < cols; col++) {
      for (const side of ['north', 'south'] as const) shells.push(slotShell(slotAt(col, side), col === cols - 1));
    }
    // fachadas de vidro do corredor: entrada a oeste e ponta leste
    const cy = (CORRIDOR_Y + CORRIDOR_H / 2) * TILE;
    return {
      exterior: layoutExterior(cols),
      shells,
      street: true,
      doormat: { x: -1.75 * TILE, y: (CORRIDOR_Y + 1.25) * TILE, w: 1.5 * TILE, h: 2.5 * TILE },
      glows: [
        { x: -20, y: cy, w: 56, h: 92, a: 0.6 },
        { x: cols * COL_W * TILE + 20, y: cy, w: 56, h: 92, a: 0.45 },
      ],
    };
  },
  cameraPad: { left: 7, top: 6, right: 7, bottom: 12 },
  roles: {
    lobby: RECEPTION_ID,
    arrival: RECEPTION_ID,
    kitchen: CAFE_ID,
    leisure: LOUNGE_ID,
    restroom: RESTROOM_ID,
    brand: RECEPTION_ID,
    brandName: 'Habblaud',
    names: { [RECEPTION_ID]: 'Recepção', [RESTROOM_ID]: 'Banheiros', [CAFE_ID]: 'Copa', [LOUNGE_ID]: 'Lounge' },
  },
  bucketOf: (tx, ty) => `${Math.floor(tx / COL_W)}:${ty < CORRIDOR_Y ? 'n' : ty < SOUTH_Y ? 'c' : 's'}`,
};
