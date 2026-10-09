// Tema novo a partir de outro: herda tudo e troca só o que redefinir.
import type { ArtModule } from '../art/api';
import type { BuildingPlan } from '../world/layout/plan';
import type { Theme } from './types';

export function extendTheme(
  base: Theme,
  over: { id: string; name: string; art?: Partial<ArtModule>; building?: BuildingPlan; ui?: Theme['ui']; brand?: Theme['brand']; worldAssets?: boolean },
): Theme {
  const theme: Theme = {
    id: over.id,
    name: over.name,
    art: { ...base.art, ...over.art },
    building: over.building ?? base.building,
    ui: { ...base.ui, ...over.ui },
  };
  const brand = over.brand ?? base.brand;
  if (brand) theme.brand = brand;
  const worldAssets = over.worldAssets ?? base.worldAssets;
  if (worldAssets !== undefined) theme.worldAssets = worldAssets;
  return theme;
}
