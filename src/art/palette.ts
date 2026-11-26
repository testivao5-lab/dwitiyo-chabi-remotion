export interface Pal {
  wall: string;
  wall2: string;
  floor: string;
  wood: string;
  woodDark: string;
  sky: string;
  sky2: string;
  light: string;
  lightOp: number;
  tint: string; // grade overlay colour
  tintOp: number;
  vig: number; // vignette strength
  item: string[]; // grocery colours
}

const items = ['#c9b78f', '#a8553f', '#d1a94c', '#6f8a6a', '#8d9aa8', '#b8765a', '#e0d8c4', '#5f7280'];

export const PAL: Record<string, Pal> = {
  // current-day confrontation: grey-green, muted ochre, cool shadow
  present: {
    wall: '#8a9684',
    wall2: '#76836f',
    floor: '#5d5b50',
    wood: '#8b6b49',
    woodDark: '#5b4430',
    sky: '#cfdcd8',
    sky2: '#a9bdb9',
    light: '#e6f0e6',
    lightOp: 0.2,
    tint: '#2c4a47',
    tintOp: 0.14,
    vig: 0.5,
    item: items,
  },
  // memory: warm amber
  memory: {
    wall: '#dba869',
    wall2: '#c78f55',
    floor: '#8f6139',
    wood: '#b9824a',
    woodDark: '#7a4f2d',
    sky: '#ffe2ae',
    sky2: '#f5c77f',
    light: '#ffdca0',
    lightOp: 0.3,
    tint: '#ff9b3d',
    tintOp: 0.12,
    vig: 0.42,
    item: items,
  },
  // tightening ownership: warm but harder contrast
  tight: {
    wall: '#c79862',
    wall2: '#a97b4c',
    floor: '#6f4b30',
    wood: '#9a6b40',
    woodDark: '#573823',
    sky: '#f2d3a1',
    sky2: '#d9ad72',
    light: '#ffd69a',
    lightOp: 0.24,
    tint: '#3a2412',
    tintOp: 0.2,
    vig: 0.6,
    item: items,
  },
  // absence: desaturated olive, dusty blue-grey
  absence: {
    wall: '#7f846f',
    wall2: '#6b7266',
    floor: '#4e514b',
    wood: '#7a6a55',
    woodDark: '#4c4237',
    sky: '#c3cbcc',
    sky2: '#9fadb3',
    light: '#d3dbdc',
    lightOp: 0.16,
    tint: '#3f5560',
    tintOp: 0.2,
    vig: 0.58,
    item: items,
  },
  // night, single practical light
  night: {
    wall: '#3c3f4c',
    wall2: '#2e313d',
    floor: '#24262f',
    wood: '#5b4631',
    woodDark: '#33271c',
    sky: '#1d2438',
    sky2: '#10162a',
    light: '#ffcf8a',
    lightOp: 0.25,
    tint: '#101a3a',
    tintOp: 0.35,
    vig: 0.75,
    item: items,
  },
  // neutral daylight: balanced
  neutral: {
    wall: '#cabda3',
    wall2: '#b6aa90',
    floor: '#7b6c57',
    wood: '#a17b53',
    woodDark: '#664b32',
    sky: '#f6efdc',
    sky2: '#dfe6dd',
    light: '#fff4da',
    lightOp: 0.26,
    tint: '#ffffff',
    tintOp: 0.0,
    vig: 0.38,
    item: items,
  },
  // ending: restrained warm highlight
  ending: {
    wall: '#d0bb98',
    wall2: '#bba57f',
    floor: '#7d6850',
    wood: '#a8794a',
    woodDark: '#694a2e',
    sky: '#f6e3bd',
    sky2: '#e9cf9e',
    light: '#ffe2aa',
    lightOp: 0.3,
    tint: '#ffb35c',
    tintOp: 0.07,
    vig: 0.42,
    item: items,
  },
  // home evening: practical warm light
  home: {
    wall: '#b79b7c',
    wall2: '#9d8265',
    floor: '#5e4533',
    wood: '#8b6444',
    woodDark: '#503824',
    sky: '#34405e',
    sky2: '#1f2744',
    light: '#ffd596',
    lightOp: 0.22,
    tint: '#18224a',
    tintOp: 0.26,
    vig: 0.62,
    item: items,
  },
};
