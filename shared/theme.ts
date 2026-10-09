// Temas do escritório: o servidor escolhe (HABBLAUD_TEMA ou --tema) e o cliente desenha.
// Os ids precisam bater dos dois lados; o visual de cada tema mora em client/src/theme/.
import type { PersonName } from './names';

export const THEME_IDS = ['escritorio', 'asgard'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME: ThemeId = 'escritorio';

export function parseThemeId(v: string | null | undefined): ThemeId | undefined {
  const id = v?.trim().toLowerCase();
  return (THEME_IDS as readonly string[]).includes(id ?? '') ? (id as ThemeId) : undefined;
}

/**
 * Agentes com identidade própria no tema (`claude --agent <nome>`): todo principal com esse agente usa o mesmo nome.
 * No Asgard, cada sessão do Odin é um holograma dele; Mímir e Frigg são figuras únicas.
 */
const PERSONAS: Partial<Record<ThemeId, Readonly<Record<string, PersonName>>>> = {
  asgard: {
    odin: { name: 'Odin', look: 'm' },
    mimir: { name: 'Mímir', look: 'm' },
    frigg: { name: 'Frigg', look: 'f' },
  },
};

export function personaName(theme: ThemeId, agent: string | undefined): PersonName | undefined {
  return agent ? PERSONAS[theme]?.[agent.trim().toLowerCase()] : undefined;
}
