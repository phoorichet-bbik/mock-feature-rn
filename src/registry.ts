import React from 'react';

import FeatureDetailScreen from './screens/FeatureDetailScreen';
import SaveMediaScreen from './screens/SaveMediaScreen';

export interface ScreenEntry {
  component: React.ComponentType<any>;
  title: string;
}

export const SCREEN_REGISTRY: Record<string, ScreenEntry> = {
  detail: { component: FeatureDetailScreen, title: 'Feature Detail' },
  'save-media': { component: SaveMediaScreen, title: 'Save Image / Video' },
};
