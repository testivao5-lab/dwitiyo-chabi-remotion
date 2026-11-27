import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { Thumbnail } from './Thumbnail';
import { Profile } from './Profile';
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from './lib/story';
import { loadFont } from '@remotion/google-fonts/NotoSansBengali';

loadFont('normal', { weights: ['400', '700', '800'], subsets: ['bengali'] });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ audio: true }}
    />
    <Composition
      id="Thumbnail"
      component={Thumbnail}
      durationInFrames={1}
      fps={1}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="Profile"
      component={Profile}
      durationInFrames={1}
      fps={1}
      width={900}
      height={900}
    />
  </>
);
