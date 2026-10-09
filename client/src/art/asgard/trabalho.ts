// Asgard: móveis das salas de trabalho (a tecnologia vira magia). No lugar do monitor, um pergaminho mágico em pé
// (rects.screen/screen2 = a folha, onde o mundo desenha as runas); o resto é salão nórdico: madeira escura
// entalhada, pedra cinza-azulada, ferro, couro, peles, ouro e luz quente. Mesmas pegadas, âncoras e retângulos
// do Escritório (api.ts), então trocar o desenho não muda o comportamento.
import { cadeira, cadeiraFrente, mesa, mesaBanquete, mesaVerso, toco } from './trabalho-mesas';
import {
  bancadaEntalhe, bau, braseiro, cesto, estante, estantePergaminhos, pedraRunica, plantaAlta, plantaPequena, suporteArmas,
  trelica,
} from './trabalho-moveis';
import {
  arcoEntalhado, discoSolLua, escudoParede, estandarte, janelaArco, placaEntalhada, prateleiraChifres, quadroRunas, tapecaria,
  tocha,
} from './trabalho-parede';
import type { FurnitureRenderers } from './types';

export const TRABALHO: FurnitureRenderers = {
  desk: (v, _st, seed) => mesa(v, seed),
  desk_back: (v, _st, seed) => mesaVerso(v, seed),
  office_chair: (v) => cadeira(v),
  office_chair_front: (v) => cadeiraFrente(v),
  meeting_table: (_v, _st, seed) => mesaBanquete(seed),
  stool: () => toco(),
  bookshelf: (_v, _st, seed) => estante(seed),
  binder_shelf: (_v, _st, seed) => estantePergaminhos(seed),
  filing_cabinet: () => bau(),
  printer: () => bancadaEntalhe(),
  trash_bin: () => cesto(),
  floor_lamp: () => braseiro(),
  glass_partition: (v) => trelica(v),
  plant_small: (v, _st, seed) => plantaPequena(v, seed),
  plant_tall: (v, _st, seed) => plantaAlta(v, seed),
  weapon_rack: () => suporteArmas(),
  runestone: () => pedraRunica(),
  whiteboard: () => quadroRunas(),
  window: () => janelaArco(),
  clock: () => discoSolLua(),
  poster: (v) => escudoParede(v),
  painting: (_v, _st, seed) => tapecaria(seed),
  sign: () => placaEntalhada(),
  light_switch: (v) => tocha(v),
  door_frame: () => arcoEntalhado(),
  shelf_wall: (_v, _st, seed) => prateleiraChifres(seed),
  banner: (v) => estandarte(v),
};
