import { describe, expect, it } from 'vitest';
import { THEME_IDS } from '../../../shared/theme';
import type { ArtModule } from '../art/api';
import { officePlan } from '../world/layout/plan';
import { applyThemeUi, DEFAULT_THEME_ID, extendTheme, resolveTheme, THEMES, type Theme } from './index';

const base: Theme = {
  id: 'base',
  name: 'Base',
  art: { roomTheme: () => 'base', iconSprite: () => 'ícone' } as unknown as ArtModule,
  building: officePlan,
  ui: { '--ui-accent': '#111111' },
};
const outro: Theme = { id: 'outro', name: 'Outro', art: base.art, building: officePlan };

describe('temas', () => {
  it('o Escritório é o padrão e traz a arte inteira', () => {
    expect(DEFAULT_THEME_ID).toBe('escritorio');
    expect(THEMES[0].id).toBe('escritorio');
    // os mesmos ids que o servidor aceita em HABBLAUD_TEMA
    expect(THEMES.map((t) => t.id)).toEqual([...THEME_IDS]);
    expect(typeof THEMES[0].art.furnitureSprites).toBe('function');
    expect(typeof THEMES[0].art.avatarCanvas).toBe('function');
  });

  it('resolveTheme: o tema do servidor vale, ?tema= vence e id desconhecido é ignorado', () => {
    const list = [base, outro];
    expect(resolveTheme(undefined, '', list).id).toBe('base');
    expect(resolveTheme('outro', '', list).id).toBe('outro');
    expect(resolveTheme('base', '?tema=outro', list).id).toBe('outro');
    expect(resolveTheme('outro', '?tema=valhalla', list).id).toBe('outro');
    expect(resolveTheme('valhalla', '?mock', list).id).toBe('base');
  });

  it('extendTheme: troca só o que redefine e herda o resto do tema base', () => {
    const novo = extendTheme(base, {
      id: 'novo',
      name: 'Novo',
      art: { roomTheme: () => 'novo' } as unknown as Partial<ArtModule>,
      ui: { '--ui-text': '#eeeeee' },
    });
    expect(novo).toMatchObject({ id: 'novo', name: 'Novo', ui: { '--ui-accent': '#111111', '--ui-text': '#eeeeee' } });
    expect(novo.art.roomTheme(1)).toBe('novo');
    expect(novo.art.iconSprite('alert')).toBe('ícone');
    expect(base.art.roomTheme(1)).toBe('base');
    // quadros prontos do Escritório: herdados até um tema desligar
    expect(novo.worldAssets).toBeUndefined();
    const semQuadros = extendTheme(base, { id: 'sem', name: 'Sem', worldAssets: false });
    expect(extendTheme(semQuadros, { id: 'neto', name: 'Neto' }).worldAssets).toBe(false);
  });

  it('applyThemeUi grava só as cores que o tema define', () => {
    const set: [string, string][] = [];
    const el = { style: { setProperty: (name: string, value: string) => void set.push([name, value]) } };
    applyThemeUi(base, el);
    applyThemeUi(outro, el);
    expect(set).toEqual([['--ui-accent', '#111111']]);
  });
});
