// Tema novo a partir de outro: herda tudo e troca só o que redefinir.
import type { ArtModule } from '../art/api';
import type { BuildingPlan } from '../world/layout/plan';
import type { Theme } from './types';

export function extendTheme(
  base: Theme,
  over: { id: string; name: string; art?: Partial<ArtModule>; building?: BuildingPlan; ui?: Theme['ui'] },
): Theme {
  return { id: over.id, name: over.name, art: { ...base.art, ...over.art }, building: over.building ?? base.building, ui: { ...base.ui, ...over.ui } };
}
