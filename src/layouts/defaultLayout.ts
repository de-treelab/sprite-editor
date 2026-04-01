import type { Layout } from './layoutTypes';

export const DEFAULT_LAYOUT: Layout = {
  root: {
    type: 'split',
    id: 'root',
    direction: 'horizontal',
    children: [
      {
        type: 'panel',
        id: 'nav-panel',
        viewIds: ['navigator'],
        activeViewId: 'navigator',
      },
      {
        type: 'split',
        id: 'main-split',
        direction: 'vertical',
        children: [
          {
            type: 'split',
            id: 'top-split',
            direction: 'horizontal',
            children: [
              {
                type: 'split',
                id: 'canvas-area',
                direction: 'horizontal',
                children: [
                  {
                    type: 'panel',
                    id: 'toolbar-panel',
                    viewIds: ['toolbar'],
                    activeViewId: 'toolbar',
                  },
                  {
                    type: 'panel',
                    id: 'canvas-panel',
                    viewIds: ['canvas'],
                    activeViewId: 'canvas',
                  },
                  {
                    type: 'panel',
                    id: 'right-panel',
                    viewIds: ['tool-properties', 'onion-skin', 'color-palette', 'layers'],
                    activeViewId: 'layers',
                  },
                ],
                sizes: [0.14, 0.61, 0.25],
              },
              {
                type: 'panel',
                id: 'preview-panel',
                viewIds: ['preview'],
                activeViewId: 'preview',
              },
            ],
            sizes: [0.75, 0.25],
          },
          {
            type: 'panel',
            id: 'timeline-panel',
            viewIds: ['timeline'],
            activeViewId: 'timeline',
          },
        ],
        sizes: [0.7, 0.3],
      },
    ],
    sizes: [0.15, 0.85],
  },
  floating: [],
  hiddenViewIds: [],
  fullscreenViewId: null,
};
