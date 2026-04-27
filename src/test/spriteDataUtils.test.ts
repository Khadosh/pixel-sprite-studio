import { describe, it, expect } from 'vitest';
import { compressFrame, decompressFrame, compressAsset, decompressAsset } from '../lib/spriteDataUtils';
import { SpriteAsset } from '../lib/types';

describe('spriteDataUtils', () => {
  describe('compressFrame / decompressFrame', () => {
    it('should compress and decompress a frame without data loss', () => {
      const size = 4;
      const frame = [
        [1, 1, 0, 0],
        [0, 2, 2, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1]
      ];
      
      const compressed = compressFrame(frame);
      expect(typeof compressed).toBe('string');
      
      const decompressed = decompressFrame(compressed, size);
      expect(decompressed).toEqual(frame);
    });

    it('should handle empty or transparent frames', () => {
      const size = 2;
      const frame = [[0, 0], [0, 0]];
      const compressed = compressFrame(frame);
      expect(compressed).toBe('4x0');
      expect(decompressFrame(compressed, size)).toEqual(frame);
    });
  });

  describe('compressAsset / decompressAsset', () => {
    it('should deep compress and decompress an entire asset', () => {
      const mockAsset: SpriteAsset = {
        id: '1',
        name: 'Test',
        description: '',
        category: 'character',
        size: 2,
        palette: { 1: '#ff0000' },
        colorNames: { 1: 'Red' },
        layers: [
          {
            id: 'l1',
            name: 'Base',
            isVisible: true,
            isLocked: false,
            opacity: 1,
            frames: [[[1, 0], [0, 1]]]
          }
        ],
        animations: []
      };

      const compressed = compressAsset(mockAsset);
      // Layers frames should be strings
      expect(typeof compressed.layers[0].frames[0]).toBe('string');
      
      const decompressed = decompressAsset(compressed);
      expect(decompressed.layers?.[0].frames[0]).toEqual([[1, 0], [0, 1]]);
      expect(decompressed.name).toBe('Test');
    });
  });
});
