// Paletas das salas de projeto em Asgard (puras). O tapete (carpet/carpet2) é a lã tingida da sala: vira o tapete
// grande, o capacho da porta, o tingimento leve da pedra do piso e a cor das tábuas tingidas ('carpet'). As paredes
// alternam tronco, aduelas, pedra e madeira entalhada; mesas e cadeiras só usam variantes que o catálogo conhece.
import type { RoomTheme } from '../api';

const TEMAS: readonly RoomTheme[] = [
  // garança (vermelho) com tronco escuro
  { carpet: '#8e3b2e', carpet2: '#7a3127', wall: { base: '#6b4a32', trim: '#3e2a1c', pattern: 'plain' }, accent: '#d9a83a', deskVariant: 'dark', chairVariant: 'red' },
  // ísatis (azul) com pedra cinza-azulada
  { carpet: '#3f5a7a', carpet2: '#344b67', wall: { base: '#7b8591', trim: '#4a525c', pattern: 'brick' }, accent: '#6fc3e8', deskVariant: 'wood', chairVariant: 'blue' },
  // líquen (verde) com madeira entalhada
  { carpet: '#5d6e43', carpet2: '#4f5e38', wall: { base: '#7a5a3c', trim: '#43301f', pattern: 'wood_panel' }, accent: '#8fcf6a', deskVariant: 'wood', chairVariant: 'green' },
  // gualda (ocre) com pedra lavrada
  { carpet: '#a8813a', carpet2: '#957231', wall: { base: '#8a8f96', trim: '#555b63', pattern: 'tiles' }, accent: '#e0703a', deskVariant: 'dark', chairVariant: 'black' },
  // mirtilo (roxo) com aduelas de igreja de madeira
  { carpet: '#5e4466', carpet2: '#503a57', wall: { base: '#5f4532', trim: '#352418', pattern: 'stripes' }, accent: '#b48be0', deskVariant: 'dark', chairVariant: 'gray' },
  // nogueira (castanho) com pedra
  { carpet: '#7a5838', carpet2: '#6a4c30', wall: { base: '#747d88', trim: '#444b54', pattern: 'brick' }, accent: '#e05a4a', deskVariant: 'wood', chairVariant: 'red' },
  // fiorde (verde-azulado) com tronco
  { carpet: '#3e6b6a', carpet2: '#345b5a', wall: { base: '#6e5038', trim: '#3b2a1d', pattern: 'plain' }, accent: '#5fd0c0', deskVariant: 'dark', chairVariant: 'green' },
  // ferrugem com pedra polida de veios dourados
  { carpet: '#9a5a2e', carpet2: '#874e28', wall: { base: '#8d949b', trim: '#59606a', pattern: 'marble' }, accent: '#f2c14e', deskVariant: 'dark', chairVariant: 'black' },
  // noite polar (anil) com madeira entalhada clara
  { carpet: '#3c4766', carpet2: '#323c58', wall: { base: '#86684a', trim: '#4a3422', pattern: 'wood_panel' }, accent: '#7fa8ff', deskVariant: 'wood', chairVariant: 'blue' },
  // urze (rosado) com pedra lavrada
  { carpet: '#8a5364', carpet2: '#784656', wall: { base: '#7d858f', trim: '#4d545d', pattern: 'tiles' }, accent: '#e88aa8', deskVariant: 'wood', chairVariant: 'gray' },
];

export const ASGARD_THEME_COUNT = TEMAS.length;

export function asgardRoomTheme(seed: number): RoomTheme {
  const n = TEMAS.length;
  const t = TEMAS[((Math.floor(seed) % n) + n) % n];
  return { ...t, wall: { ...t.wall } };
}
