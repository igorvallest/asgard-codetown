// Asgard: quem anda pelo salão. Subagentes e principais sem identidade própria ganham roupas nórdicas sorteadas
// (lã, couro e pele; tranças e barbas); `claude --agent odin` é um holograma do Odin, e Mímir e Frigg têm figura
// própria. O Odin de verdade fica sentado no trono (agent 'odin:trono', personagem decorativo do plano do prédio).
import { mulberry32 } from '../../../../shared/hash';
import type { Accessory, Appearance, ArtModule, CharacterFrameRequest, HairStyle, Sprite, TopStyle } from '../api';
import * as base from '../index';
import { CHAR_W, renderCharacter } from '../character/render';
import { PixelBuf } from '../core/pixbuf';

/** As figuras próprias do tema, pelo nome do agente. */
const PERSONAS: Readonly<Record<string, Appearance>> = {
  odin: {
    skin: '#e3bfa0', hair: '#e6e3dc', hairStyle: 'long', eyes: '#5b7d9a', top: '#4b5566', topAccent: '#2b2f38', topStyle: 'hoodie',
    bottom: '#3b3f4a', shoes: '#2b211a', accessory: 'eyepatch', accessoryColor: '#1d1b1a', lanyard: null, look: 'm', facialHair: 'beard',
  },
  mimir: {
    skin: '#d9b08c', hair: '#a9b0b5', hairStyle: 'long', eyes: '#7ff0ff', top: '#2f5d62', topAccent: '#c9a227', topStyle: 'sweater',
    bottom: '#2b3b3e', shoes: '#2b211a', accessory: 'hood', accessoryColor: '#264b50', lanyard: null, look: 'm', facialHair: 'beard',
  },
  frigg: {
    skin: '#f0cdb5', hair: '#d9b45a', hairStyle: 'long', eyes: '#4a6b8a', top: '#2f4f8f', topAccent: '#e8e2d0', topStyle: 'blouse',
    bottom: '#2a3f6f', shoes: '#3a2a1e', accessory: 'circlet', accessoryColor: '#d4af37', lanyard: null, look: 'f', bottomStyle: 'skirt',
  },
};

const SKINS = ['#f3d8c4', '#ebc4a6', '#ddae8a', '#c99470', '#ad7a55', '#8a5c3d', '#6b4430'] as const;
const HAIR = ['#e9d48a', '#d8b25a', '#b5793a', '#9c4a2a', '#6b4128', '#3f2c22', '#2b2320', '#c9c4bd'] as const;
const EYES = ['#4a6b8a', '#5b7d5a', '#6b4a2a', '#3a4a5a', '#2b2236'] as const;
/** Lã tingida, couro e linho. */
const WOOL = ['#8c3b2e', '#3f5b3a', '#34507a', '#6b4a2f', '#6f6a63', '#a3832e', '#5a3f6b', '#2f5d62', '#7a2f3a'] as const;
const TRIM = ['#cbb79a', '#8a7a68', '#d9d4cc', '#5c4d3d', '#c9a227', '#e8e2d0'] as const;
const BOTTOMS = ['#4a3b2c', '#5c4d3d', '#3b3f4a', '#6b5a45', '#2e3a33', '#5a4632'] as const;
const SHOES = ['#3f2c1d', '#5a3d26', '#2b211a', '#6e4b2f'] as const;
const HOODS = ['#3f5b3a', '#34507a', '#6b4a2f', '#5a5560', '#7a2f3a'] as const;

const HAIR_M: readonly HairStyle[] = ['long', 'long', 'ponytail', 'short', 'buzz', 'mohawk', 'bald', 'wavy', 'bun', 'side_part'];
const HAIR_F: readonly HairStyle[] = ['long', 'long', 'ponytail', 'bun', 'pigtails', 'wavy', 'curly', 'bob'];
/** Túnica de lã, gibão de couro e manto com capuz. */
const TOPS: readonly TopStyle[] = ['sweater', 'sweater', 'jacket', 'hoodie'];
const ACC_M: readonly Accessory[] = ['none', 'none', 'none', 'helmet', 'hood', 'beanie'];
const ACC_F: readonly Accessory[] = ['none', 'none', 'circlet', 'hood', 'earrings'];
const FACIAL = ['beard', 'beard', 'beard', 'goatee', 'mustache', 'stubble', 'none'] as const;

function personaOf(agent: string | undefined): { appearance: Appearance; hologram: boolean } | undefined {
  const [name, where] = (agent ?? '').trim().toLowerCase().split(':');
  const appearance = PERSONAS[name];
  // Cada sessão do Odin é uma manifestação dele (holograma); o do trono é o próprio.
  return appearance ? { appearance, hologram: name === 'odin' && where !== 'trono' } : undefined;
}

export function asgardAppearance(seed: number, opts: { look?: 'f' | 'm'; sub?: boolean; agent?: string } = {}): Appearance {
  const persona = opts.sub ? undefined : personaOf(opts.agent);
  if (persona) return persona.hologram ? { ...persona.appearance, hologram: true } : persona.appearance;
  const rnd = mulberry32((seed ^ 0xa5ead) >>> 0);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length) % arr.length];
  const look: 'f' | 'm' = opts.look ?? (rnd() < 0.5 ? 'f' : 'm');
  const top = pick(WOOL);
  let accessory = pick(look === 'm' ? ACC_M : ACC_F);
  const hairStyle = pick(look === 'm' ? HAIR_M : HAIR_F);
  if ((accessory === 'helmet' || accessory === 'beanie') && (hairStyle === 'mohawk' || hairStyle === 'bun' || hairStyle === 'pigtails')) accessory = 'none';
  const accessoryColor = accessory === 'helmet' ? '#9aa1a8' : accessory === 'circlet' || accessory === 'earrings' ? '#d4af37' : pick(HOODS);
  return {
    skin: pick(SKINS),
    hair: pick(HAIR),
    hairStyle,
    eyes: pick(EYES),
    top,
    topAccent: pick(TRIM),
    topStyle: pick(TOPS),
    bottom: pick(BOTTOMS),
    shoes: pick(SHOES),
    accessory,
    accessoryColor,
    // subagente: o cordão vira um amuleto de bronze
    lanyard: opts.sub ? '#b98b3a' : null,
    look,
    facialHair: look === 'm' ? pick(FACIAL) : 'none',
    bottomStyle: look === 'f' && rnd() < 0.45 ? 'skirt' : 'pants',
  };
}

// ------------------------------------------------------------------ holograma

const holoCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

/** Cópia translúcida e azulada do desenho, com linhas de varredura (cada 3ª linha mais fraca). */
function hologramOf(src: HTMLCanvasElement): HTMLCanvasElement {
  let out = holoCache.get(src);
  if (out) return out;
  out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  // o mundo também lê este canvas (caixa do personagem): sem a dica, o Chrome reclama de leituras repetidas
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (ctx && src.width && src.height) {
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, out.width, out.height);
    const d = img.data;
    for (let y = 0; y < out.height; y++) {
      for (let x = 0; x < out.width; x++) {
        const i = (y * out.width + x) * 4;
        if (!d[i + 3]) continue;
        const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
        d[i] = Math.round(40 + l * 0.35);
        d[i + 1] = Math.round(130 + l * 0.48);
        d[i + 2] = Math.round(175 + l * 0.31);
        d[i + 3] = Math.round(d[i + 3] * (y % 3 === 0 ? 0.45 : 0.76));
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  holoCache.set(src, out);
  return out;
}

function characterSprite(req: CharacterFrameRequest): Sprite {
  const s = base.characterSprite(req);
  return req.appearance.hologram ? { ...s, canvas: hologramOf(s.canvas) } : s;
}

const avatarCache = new Map<string, HTMLCanvasElement>();

/** Busto ampliado para a UI, com a figura do tema (o holograma do Odin inclusive). */
function avatarCanvas(seed: number, opts: { look?: 'f' | 'm'; sub?: boolean; scale?: number; agent?: string } = {}): HTMLCanvasElement {
  const scale = Math.max(1, Math.round(opts.scale ?? 3));
  const key = `${seed}|${opts.look ?? '-'}|${opts.sub ? 1 : 0}|${scale}|${opts.agent ?? ''}`;
  let c = avatarCache.get(key);
  if (c) return c;
  const appearance = asgardAppearance(seed, opts);
  const s = renderCharacter({ appearance, dir: 'down', pose: 'stand', frame: 0 });
  // Busto: cabeça + ombros (20x20 a partir do topo do cabelo), como no Escritório.
  const crop = s.buf.crop(2, 2, CHAR_W - 4, 20);
  const out = new PixelBuf(crop.w * scale, crop.h * scale);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const si = (Math.floor(y / scale) * crop.w + Math.floor(x / scale)) * 4;
      const di = (y * out.w + x) * 4;
      for (let k = 0; k < 4; k++) out.data[di + k] = crop.data[si + k];
    }
  }
  c = base.toCanvas(out);
  if (appearance.hologram) c = hologramOf(c);
  if (avatarCache.size > 2000) avatarCache.clear();
  avatarCache.set(key, c);
  return c;
}

export const PERSONAGENS: Partial<ArtModule> = { appearanceFromSeed: asgardAppearance, characterSprite, avatarCanvas };
