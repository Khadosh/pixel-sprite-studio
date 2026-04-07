import { describe, it, expect } from 'vitest';
import { compositeFrame } from '../lib/layerUtils';
import { SpriteAsset } from '../lib/types';

describe('compositeFrame', () => {
  it('should handle mismatched layer sizes without crashing', () => {
    const mockAsset: SpriteAsset = {
      id: 'test',
      name: 'Test',
      description: '',
      category: 'character',
      size: 4, // 4x4 asset
      palette: { 1: '#ff0000' },
      colorNames: { 1: 'Red' },
      layers: [
        {
          id: 'l1',
          name: 'Layer 1',
          isVisible: true,
          isLocked: false,
          opacity: 1,
          frames: [
            [[1, 1], [1, 1]] // Only 2x2 frames!
          ]
        }
      ],
      animations: []
    };

    // Should not throw and should return a 4x4 frame
    const result = compositeFrame(mockAsset, 0);
    expect(result.length).toBe(4);
    expect(result[0].length).toBe(4);
    
    // Check that pixels were copied correctly where they exist
    expect(result[0][0]).toBe(1);
    expect(result[1][1]).toBe(1);
    
    // Check that non-existent rows/pixels are 0 (transparent)
    expect(result[2][0]).toBe(0);
    expect(result[0][2]).toBe(0);
  });
});
