// Contratos internos da arte de Asgard.
import type { ArtModule, FurnitureKind } from '../api';
import type { BufFurniture } from '../core/sprite';

/**
 * Desenho de um móvel em buffer (puro, testável em Node), com variante e estado já normalizados e a variação de
 * detalhes (`seed`, 0..n-1, ver SEED_VARIATIONS em furniture/index.ts). Mesmas âncoras e retângulos do catálogo de
 * api.ts: o mundo posiciona e anima pelo tipo, então trocar o desenho não muda o comportamento.
 */
export type FurnitureRenderer = (variant: string | undefined, state: number, seed: number) => BufFurniture;

export type FurnitureRenderers = Partial<Record<FurnitureKind, FurnitureRenderer>>;

/** Pisos, paredes, telas, quadro, janela, relógio e paletas das salas que Asgard redesenha. */
export type SurfaceArt = Partial<
  Pick<
    ArtModule,
    'drawFloor' | 'drawRug' | 'drawWallFace' | 'drawWallTop' | 'drawSouthWall' | 'drawScreen' | 'drawBoard' | 'drawWindowView' | 'drawClock' | 'roomTheme' | 'propSprite'
  >
>;
