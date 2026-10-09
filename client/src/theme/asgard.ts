// Tema Asgard: o salão dos deuses. Odin no trono, a Bifrost por onde todos chegam e as salas de projeto em
// fileiras que crescem para baixo (world/layout/asgard.ts).
import { asgardPlan } from '../world/layout/asgard';
import { escritorio } from './escritorio';
import { extendTheme } from './extend';

export const asgard = extendTheme(escritorio, { id: 'asgard', name: 'Asgard', building: asgardPlan });
