import { hash32 } from './hash';
import type { ThemeId } from './theme';

export interface PersonName {
  name: string;
  look: 'f' | 'm';
}

// Nomes brasileiros para os personagens. Sem duplicatas e sem variações quase iguais
// (ex.: Thiago/Tiago), para que cada personagem seja inconfundível no escritório.
const F = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Júlia',
  'Larissa', 'Mariana', 'Natália', 'Olívia', 'Paula', 'Rebeca', 'Sofia', 'Tatiana', 'Valentina', 'Yasmin',
  'Alice', 'Bianca', 'Cecília', 'Débora', 'Elisa', 'Flávia', 'Giovana', 'Heloísa', 'Iara', 'Jéssica',
  'Lívia', 'Manuela', 'Melissa', 'Nina', 'Priscila', 'Rafaela', 'Sabrina', 'Teresa', 'Vitória', 'Zoe',
  'Aline', 'Bruna', 'Clara', 'Estela', 'Fabiana', 'Glória', 'Ingrid', 'Joana', 'Kátia', 'Lara',
  'Maitê', 'Mirela', 'Noemi', 'Pietra', 'Renata', 'Simone', 'Sara', 'Vanessa', 'Luana', 'Marina',
];
const M = [
  'Arthur', 'Bruno', 'Caio', 'Diego', 'Enzo', 'Felipe', 'Gustavo', 'Henrique', 'Igor', 'João',
  'Kauã', 'Lucas', 'Mateus', 'Nicolas', 'Otávio', 'Pedro', 'Rafael', 'Samuel', 'Thiago', 'Vinícius',
  'Bernardo', 'Danilo', 'Davi', 'Emanuel', 'Fábio', 'Gael', 'Heitor', 'Hugo', 'Joaquim', 'Jorge',
  'Leonardo', 'Lorenzo', 'Luan', 'Marcelo', 'Murilo', 'Noah', 'Otto', 'Raul', 'Renato', 'Ricardo',
  'Rodrigo', 'Sérgio', 'Theo', 'Tomás', 'Ulisses', 'Vicente', 'Wagner', 'Yuri', 'Augusto', 'Benício',
  'César', 'Douglas', 'Elias', 'Francisco', 'Guilherme', 'Ícaro', 'Jonas', 'Leandro', 'Miguel', 'Paulo',
];

// Intercala para que nomes vizinhos no pool alternem a dica visual.
const interleave = (f: readonly string[], m: readonly string[]): readonly PersonName[] =>
  Object.freeze(f.flatMap((name, i) => [{ name, look: 'f' as const }, ...(m[i] ? [{ name: m[i], look: 'm' as const }] : [])]));

export const NAME_POOL: readonly PersonName[] = interleave(F, M);

// Tema Asgard: nomes das sagas nórdicas. Nenhum deus (Odin, Thor, Frigg, Loki, Mímir...): esses são figuras
// únicas do tema e não podem sair no sorteio.
const NORSE_F = [
  'Astrid', 'Sigrid', 'Ingrid', 'Gunnhild', 'Ragnhild', 'Solveig', 'Thora', 'Helga', 'Asa', 'Brynhild',
  'Dagny', 'Gudrun', 'Hilda', 'Kari', 'Liv', 'Runa', 'Signy', 'Svanhild', 'Thyra', 'Tove',
  'Unn', 'Yrsa', 'Alfhild', 'Bodil', 'Frida', 'Gyda', 'Halla', 'Inga', 'Jorunn', 'Ragna',
  'Sigrun', 'Steinunn', 'Thordis', 'Thorunn', 'Vigdis', 'Aslaug', 'Borghild', 'Estrid', 'Freydis', 'Gunnvor',
  'Hallgerd', 'Herdis', 'Ingeborg', 'Oddny', 'Asgerd', 'Thorgerd', 'Ulfhild', 'Valdis', 'Hervor', 'Aud',
  'Bergljot', 'Edda', 'Gro', 'Hjordis', 'Ingunn', 'Rannveig', 'Sunniva', 'Ylva', 'Katla', 'Eydis',
];
const NORSE_M = [
  'Bjorn', 'Ragnar', 'Leif', 'Ivar', 'Erik', 'Harald', 'Gunnar', 'Sigurd', 'Ulf', 'Torvald',
  'Halvard', 'Arne', 'Rolf', 'Egil', 'Floki', 'Gorm', 'Hakon', 'Orm', 'Sven', 'Toke',
  'Ubbe', 'Asmund', 'Brand', 'Dag', 'Einar', 'Frode', 'Grim', 'Hemming', 'Ingvar', 'Ketil',
  'Knut', 'Olaf', 'Rurik', 'Skarde', 'Thorstein', 'Vemund', 'Alrik', 'Bard', 'Eyvind', 'Finn',
  'Geir', 'Hauk', 'Hrafn', 'Ottar', 'Ragnvald', 'Snorre', 'Steinar', 'Tryggve', 'Vagn', 'Arnulf',
  'Bodvar', 'Eilif', 'Gisli', 'Hjalmar', 'Kolbein', 'Njal', 'Odd', 'Skeggi', 'Thorkel', 'Vestein',
];

export const NORSE_NAME_POOL: readonly PersonName[] = interleave(NORSE_F, NORSE_M);

/** Pool de nomes sorteados do tema. */
export function namePoolFor(theme: ThemeId): readonly PersonName[] {
  return theme === 'asgard' ? NORSE_NAME_POOL : NAME_POOL;
}

/**
 * Escolhe um nome determinístico para `id`, evitando os já usados.
 * Se o pool esgotar, acrescenta um sufixo numérico ("Ana 2").
 */
export function pickName(id: string, used: ReadonlySet<string>, pool: readonly PersonName[] = NAME_POOL): PersonName {
  const n = pool.length;
  const start = hash32(id) % n;
  for (let i = 0; i < n; i++) {
    const cand = pool[(start + i) % n];
    if (!used.has(cand.name)) return cand;
  }
  const base = pool[start];
  for (let k = 2; ; k++) {
    const name = `${base.name} ${k}`;
    if (!used.has(name)) return { name, look: base.look };
  }
}
