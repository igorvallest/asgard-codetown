// Arte do tema Asgard: a mesma engine de pixel art do Escritório, com móveis, pisos e telas nórdicos.
// Tudo o que Asgard não redesenha cai na arte do Escritório (art/index.ts).
import * as base from '../index';
import type { ArtModule, FurnitureKind, FurnitureSprites } from '../api';
import { trim } from '../core/sprite';
import { normalizeFurniture } from '../furniture/index';
import { PERSONAGENS } from './personagens';
import { SALOES } from './saloes';
import { SUPERFICIES } from './superficies';
import { TRABALHO } from './trabalho';
import type { FurnitureRenderers } from './types';

export const ASGARD_FURNITURE: FurnitureRenderers = { ...TRABALHO, ...SALOES };

const cache = new Map<string, FurnitureSprites>();

function furnitureSprites(kind: FurnitureKind, variant?: string, state?: number, opts: { seed?: number } = {}): FurnitureSprites {
  const render = ASGARD_FURNITURE[kind];
  if (!render) return base.furnitureSprites(kind, variant, state, opts);
  const n = normalizeFurniture(kind, variant, state, opts.seed);
  const key = `${kind}|${n.variant ?? '-'}|${n.state}|${n.vseed}`;
  let s = cache.get(key);
  if (!s) {
    if (cache.size > 4000) cache.clear();
    const f = render(n.variant, n.state, n.vseed);
    s = { base: base.toSprite(trim(f.base)), front: f.front ? base.toSprite(trim(f.front)) : undefined };
    cache.set(key, s);
  }
  return s;
}

export const asgardArt: Partial<ArtModule> = { ...SUPERFICIES, ...PERSONAGENS, furnitureSprites };
