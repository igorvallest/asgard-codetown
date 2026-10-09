// Asgard: o trono, a Bifrost e os móveis dos salões (cozinha, salão de lazer e banheiro).
import * as B from './saloes-banheiro';
import * as K from './saloes-cozinha';
import * as L from './saloes-lazer';
import * as S from './saloes-salas';
import * as T from './saloes-trono';
import type { FurnitureRenderers } from './types';

export const SALOES: FurnitureRenderers = {
  // sala do trono
  throne: () => T.throne(),
  wolf: (v) => T.wolf(v),
  pillar: () => T.pillar(),
  elevator: (_v, st) => T.elevator(st),
  reception_desk: (_v, _st, seed) => T.receptionDesk(seed),
  bench: () => T.bench(),
  // cozinha
  counter: (v) => K.counter(v),
  counter_sink: () => K.counterSink(),
  coffee_machine: (_v, st) => K.coffeeMachine(st),
  microwave: () => K.microwave(),
  fridge: () => K.fridge(),
  vending_machine: () => K.vendingMachine(),
  water_cooler: () => K.waterCooler(),
  barrel: () => K.barrel(),
  cafe_table: () => K.cafeTable(),
  cafe_chair: (v) => K.cafeChair(v),
  // salão de lazer
  hearth: () => L.hearth(),
  tv: () => L.tv(),
  arcade: () => L.arcade(),
  pingpong_table: () => L.pingpongTable(),
  sofa: (v) => L.sofa(v),
  armchair: (v) => L.armchair(v),
  coffee_table: (_v, _st, seed) => L.coffeeTable(seed),
  beanbag: (v) => L.beanbag(v),
  // banheiro
  toilet_stall: (_v, st) => B.toiletStall(st),
  sink: () => B.sink(),
  mirror: () => B.mirror(),
  // salas do Mímir e da Frigg
  well: () => S.well(),
  loom: () => S.loom(),
  spinning_wheel: () => S.spinningWheel(),
};
