import { describe, it, expect } from 'vitest';
import { compressState, decompressState } from './storageCompression';

describe('storageCompression', () => {
  it('should compress and decompress a simple state with frames', () => {
    const frame1 = [
      [1, 1],
      [1, 1]
    ];
    const frame2 = [
      [0, 0],
      [0, 0]
    ];
    
    const state = {
      active: frame1,
      history: [frame1, frame2, frame1]
    };

    const compressed = compressState(state);
    
    // Should have a pool with 2 unique frames
    expect(compressed.__p).toHaveLength(2);
    
    // Active frame should be a reference
    expect(compressed.active).toEqual({ _p: 0 });
    
    // History should have references
    expect(compressed.history).toEqual([{ _p: 0 }, { _p: 1 }, { _p: 0 }]);

    const decompressed = decompressState(compressed);
    expect(decompressed).toEqual(state);
    
    // Structural integrity check: identical frames should point to the SAME array instance
    expect(decompressed.active).toBe(decompressed.history[0]);
    expect(decompressed.active).toBe(decompressed.history[2]);
  });

  it('should handle complex nested objects', () => {
    const frame = [[1]];
    const state = {
      meta: {
        author: 'Antigravity',
        nested: {
          asset: {
            layers: [{ frames: [frame] }]
          }
        }
      }
    };

    const compressed = compressState(state);
    const decompressed = decompressState(compressed);
    expect(decompressed).toEqual(state);
  });

  it('should return original state if no pool exists during decompression', () => {
    const state = { a: 1 };
    expect(decompressState(state)).toEqual(state);
  });

  it('should handle empty or null values', () => {
    const state = { a: null, b: undefined, c: [] };
    const compressed = compressState(state);
    const decompressed = decompressState(compressed);
    expect(decompressed).toEqual(state);
  });
});
