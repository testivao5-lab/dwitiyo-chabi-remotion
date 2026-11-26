import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from './lib/story';
import { loadFont } from '@remotion/google-fonts/NotoSansBengali';

loadFont('normal', { weights: ['800'], subsets: ['bengali'] });

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Film"
    component={Film}
    durationInFrames={DURATION_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{ audio: true }}
  />
);
