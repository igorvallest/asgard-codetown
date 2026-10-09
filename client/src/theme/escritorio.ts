// Tema padrão: o escritório moderno de sempre, com a arte procedural de art/.
import * as art from '../art';
import { officePlan } from '../world/layout/plan';
import type { Theme } from './types';

export const escritorio: Theme = { id: 'escritorio', name: 'Escritório', art, building: officePlan };
