import { AppProject } from '../types/project';

export const createMockProject = (): AppProject => {
  return {
    id: 'proj_1',
    name: 'Untitled Project',
    defaultCanvasSize: { width: 32, height: 32 },
    palettes: [],
    spritesheets: [
      {
        id: 'sheet_1',
        name: 'Main Character',
        animations: [
          {
            id: 'anim_1',
            name: 'Idle',
            keyframes: [
              { id: 'kf_1', time: 0, frameId: 'frame_1' },
              { id: 'kf_2', time: 500, frameId: 'frame_2' },
            ],
          },
        ],
        images: [],
        frames: [
          {
            id: 'frame_1',
            layers: [
              {
                id: 'l_1',
                name: 'Base',
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                locked: false,
                isReference: false,
                data: '',
              },
            ],
          },
          {
            id: 'frame_2',
            layers: [
              {
                id: 'l_2',
                name: 'Base',
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                locked: false,
                isReference: false,
                data: '',
              },
            ],
          }
        ]
      }
    ]
  };
};
