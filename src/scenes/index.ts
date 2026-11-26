import { Ctx, SceneOut } from './kit';
import { s01, s02, s03, s04, s05, s06, s07, s08, s09, s10 } from './scenesA';
import { s11, s12, s13, s14, s15, s16, s17, s18, s19, s20 } from './scenesB';
import { s21, s22, s23, s24, s25, s26, s27, s28, s29 } from './scenesC';

export const SCENES: ((c: Ctx) => SceneOut)[] = [
  s01, s02, s03, s04, s05, s06, s07, s08, s09, s10,
  s11, s12, s13, s14, s15, s16, s17, s18, s19, s20,
  s21, s22, s23, s24, s25, s26, s27, s28, s29,
];
