// Temas: registro, escolha (preferência ou ?tema= na URL) e o tema ativo, definido uma vez ao abrir a página.
// Trocar de tema recarrega a página: os sprites ficam em cache dentro de cada módulo de arte.
import type { ArtModule } from '../art/api';
import { escritorio } from './escritorio';
import type { Theme } from './types';

export type { Theme, UiVar } from './types';

/** Temas disponíveis; o primeiro é o padrão. */
export const THEMES: readonly Theme[] = [escritorio];
export const DEFAULT_THEME_ID = escritorio.id;

export function themeById(id: string | null | undefined, themes: readonly Theme[] = THEMES): Theme | undefined {
  return id ? themes.find((t) => t.id === id) : undefined;
}

/** ?tema=<id> na URL vence a preferência; id desconhecido é ignorado e, sem nenhum válido, vale o padrão. */
export function resolveTheme(prefId: string | undefined, search = '', themes: readonly Theme[] = THEMES): Theme {
  return themeById(new URLSearchParams(search).get('tema'), themes) ?? themeById(prefId, themes) ?? themes[0];
}

/** Tema novo a partir de outro: herda tudo e troca só o que redefinir. */
export function extendTheme(base: Theme, over: { id: string; name: string; art?: Partial<ArtModule>; ui?: Theme['ui'] }): Theme {
  return { id: over.id, name: over.name, art: { ...base.art, ...over.art }, ui: { ...base.ui, ...over.ui } };
}

let active: Theme = escritorio;

export function setActiveTheme(theme: Theme): void {
  active = theme;
}

export function activeTheme(): Theme {
  return active;
}

/** Grava as cores do tema no elemento raiz da UI (é nele, em .ui-root, que ui/styles.css define as --ui-*). */
export function applyThemeUi(theme: Theme, el: { style: { setProperty(name: string, value: string): void } }): void {
  for (const [name, value] of Object.entries(theme.ui ?? {})) {
    if (value) el.style.setProperty(name, value);
  }
}
