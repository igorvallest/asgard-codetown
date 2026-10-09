// Tema Asgard: o salão dos deuses. Odin no trono, a Bifrost por onde todos chegam e as salas de projeto em
// fileiras que crescem para baixo (world/layout/asgard.ts), com a arte nórdica de art/asgard e painéis em madeira
// escura com dourado.
import { asgardArt } from '../art/asgard';
import { pixelIcon } from '../ui/icons';
import { asgardPlan } from '../world/layout/asgard';
import { escritorio } from './escritorio';
import { extendTheme } from './extend';

/** Letras 5x7 do logotipo. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  A: ['.ccc.', 'c...c', 'c...c', 'ccccc', 'c...c', 'c...c', 'c...c'],
  S: ['.cccc', 'c....', 'c....', '.ccc.', '....c', '....c', 'cccc.'],
  G: ['.ccc.', 'c...c', 'c....', 'c.ccc', 'c...c', 'c...c', '.ccc.'],
  R: ['cccc.', 'c...c', 'c...c', 'cccc.', 'c.c..', 'c..c.', 'c...c'],
  D: ['cccc.', 'c...c', 'c...c', 'c...c', 'c...c', 'c...c', 'cccc.'],
};

/** Palavra em pixels, com a sombra de 1 px embaixo e à direita (como o logotipo do Habblaud). */
function pixelWord(word: string): string[] {
  const rows = Array.from({ length: 7 }, (_, y) => [...word].map((ch) => GLYPHS[ch][y]).join('.'));
  const w = rows[0].length + 1;
  const grid = Array.from({ length: 8 }, (_, y) => Array.from({ length: w }, (_, x) => rows[y]?.[x] ?? '.'));
  for (let y = 6; y >= 0; y--) for (let x = w - 2; x >= 0; x--) if (grid[y][x] === 'c' && grid[y + 1][x + 1] === '.') grid[y + 1][x + 1] = 's';
  return grid.map((r) => r.join(''));
}

/** Ansuz, a runa de Odin, gravada em ouro numa placa de madeira escura. */
const ANSUZ = [
  '.oooooooooooooo.',
  'obbbbbbbbbbbbbbo',
  'obbbbggbbbbbbbbo',
  'obbbbgggbbbbbbbo',
  'obbbbggbggbbbbbo',
  'obbbbggbbgggbbbo',
  'obbbbggbbbbggbbo',
  'obbbbgggbbbbbbbo',
  'obbbbggbggbbbbbo',
  'obbbbggbbgggbbbo',
  'obbbbggbbbbggbbo',
  'obbbbggbbbbbbbbo',
  'obbbbggbbbbbbbbo',
  'obbbbggbbbbbbbbo',
  'obbbbbbbbbbbbbbo',
  '.oooooooooooooo.',
];

export const asgard = extendTheme(escritorio, {
  id: 'asgard',
  name: 'Asgard',
  art: asgardArt,
  building: asgardPlan,
  ui: {
    '--ui-bg': 'rgba(30, 21, 15, 0.88)',
    '--ui-bg-solid': 'rgba(34, 24, 17, 0.97)',
    '--ui-bg-soft': 'rgba(255, 226, 170, 0.04)',
    '--ui-bg-hover': 'rgba(255, 226, 170, 0.07)',
    '--ui-line': 'rgba(214, 172, 106, 0.16)',
    '--ui-line-strong': 'rgba(214, 172, 106, 0.3)',
    '--ui-text': '#f2e7d3',
    '--ui-muted': '#c4ae8c',
    '--ui-faint': '#a9926f',
    '--ui-accent': '#e6b85c',
    '--ui-accent-soft': 'rgba(230, 184, 92, 0.15)',
  },
  brand: {
    name: 'Asgard',
    wordmark: pixelIcon(pixelWord('ASGARD'), { c: '#f2c14e', s: 'rgba(6, 8, 14, 0.62)' }, 'ui-wordmark'),
    mark: pixelIcon(ANSUZ, { o: '#6b4a2a', b: '#2a1d12', g: '#f2c14e' }, 'ui-px-icon ui-mark'),
  },
  // os quadros e a placa gerados por IA são do Escritório: aqui valem os escudos e estandartes desenhados
  worldAssets: false,
});
