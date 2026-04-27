import { describe, it, expect } from 'vitest';
import { compressState, decompressState } from './storageCompression';
import type { Frame } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIZES = [16, 32, 64, 128] as const;

function makeFrame(size: number, pattern = 0): Frame {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (r + c + pattern) % 8 === 0 ? 1 : 0)
  );
}

function makeEmptyFrame(size: number): Frame {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

// ---------------------------------------------------------------------------
// Basic compress / decompress
// ---------------------------------------------------------------------------

describe('storageCompression — basic', () => {
  it('deduplicates identical frames and round-trips correctly', () => {
    const f1: Frame = [[1, 1], [1, 1]];
    const f2: Frame = [[0, 0], [0, 0]];
    const state = { active: f1, history: [f1, f2, f1] };

    const compressed = compressState(state);

    expect(compressed.__p).toHaveLength(2);
    expect(compressed.active).toEqual({ _p: 0 });
    expect(compressed.history).toEqual([{ _p: 0 }, { _p: 1 }, { _p: 0 }]);

    const decompressed = decompressState(compressed);
    expect(decompressed).toEqual(state);

    // Same pool reference — identity preserved
    expect(decompressed.active).toBe(decompressed.history[0]);
    expect(decompressed.active).toBe(decompressed.history[2]);
  });

  it('handles deeply nested objects', () => {
    const frame: Frame = [[1, 2], [3, 4]];
    const state = {
      meta: { nested: { asset: { layers: [{ frames: [frame, frame] }] } } },
    };
    const compressed = compressState(state);
    expect(compressed.__p).toHaveLength(1); // only 1 unique frame
    const decompressed = decompressState(compressed);
    expect(decompressed).toEqual(state);
  });

  it('returns original state if no pool exists during decompression', () => {
    const state = { a: 1, b: 'hello' };
    expect(decompressState(state)).toEqual(state);
  });

  it('handles null and undefined values without throwing', () => {
    const state = { a: null, b: undefined, c: 42 };
    const compressed = compressState(state);
    const decompressed = decompressState(compressed);
    expect(decompressed.a).toBeNull();
    expect(decompressed.c).toBe(42);
  });

  it('handles empty arrays without treating them as frames', () => {
    const state = { arr: [], data: 1 };
    const compressed = compressState(state);
    expect(compressed.__p).toHaveLength(0); // [] is NOT a frame
    expect(decompressState(compressed).arr).toEqual([]);
  });

  it('handles a frame with a single empty row — not detected as a frame', () => {
    const notAFrame = [[]]; // [[]] — first row is empty
    const state = { f: notAFrame };
    const compressed = compressState(state);
    expect(compressed.__p).toHaveLength(0); // should NOT be pooled
  });
});

// ---------------------------------------------------------------------------
// Frame detection & deduplication across sizes
// ---------------------------------------------------------------------------

describe('storageCompression — frame detection by size', () => {
  SIZES.forEach(size => {
    it(`correctly deduplicates ${size}×${size} frames`, () => {
      const f1 = makeFrame(size, 0);
      const f2 = makeFrame(size, 1);

      const state = {
        layers: [
          { frames: [f1, f2, f1, f1] },
          { frames: [f2, f1, f2] },
        ],
      };

      const compressed = compressState(state);
      expect(compressed.__p).toHaveLength(2); // exactly 2 unique frames

      const decompressed = decompressState(compressed);
      expect(decompressed).toEqual(state);
    });

    it(`round-trips a ${size}×${size} empty frame`, () => {
      const empty = makeEmptyFrame(size);
      const state = { layers: [{ frames: [empty] }] };
      const compressed = compressState(state);
      const decompressed = decompressState(compressed);
      expect(decompressed.layers[0].frames[0]).toEqual(empty);
    });
  });
});

// ---------------------------------------------------------------------------
// Hash collision safety
// ---------------------------------------------------------------------------

describe('storageCompression — hash collision safety', () => {
  it('correctly deduplicates when two different frames are compared', () => {
    const f1: Frame = [[1, 0], [0, 1]];
    const f2: Frame = [[0, 1], [1, 0]];
    const state = { a: f1, b: f2, c: f1, d: f2 };

    const compressed = compressState(state);
    expect(compressed.__p).toHaveLength(2);

    const decompressed = decompressState(compressed);
    expect(decompressed.a).toEqual(f1);
    expect(decompressed.b).toEqual(f2);
    // Identity preserved for references
    expect(decompressed.a).toBe(decompressed.c);
    expect(decompressed.b).toBe(decompressed.d);
  });
});

// ---------------------------------------------------------------------------
// Compression ratio regression guards
// ---------------------------------------------------------------------------

describe('storageCompression — compression ratio regression', () => {
  it('compresses a state with 5 identical 32×32 frames to < 50% of raw', () => {
    const shared = makeFrame(32);
    const state = {
      layers: Array.from({ length: 3 }, () => ({ frames: Array(5).fill(shared) })),
    };
    const raw = JSON.stringify(state).length;
    const compressed = JSON.stringify(compressState(state)).length;

    expect(compressed).toBeLessThan(raw * 0.5);
    expect(compressState(state).__p).toHaveLength(1); // only 1 unique frame
  });

  SIZES.forEach(size => {
    it(`achieves meaningful compression for ${size}×${size} shared frames`, () => {
      const shared = makeFrame(size);
      const unique = makeFrame(size, 3);
      const state = {
        layers: [{ frames: [shared, shared, unique, shared] }],
      };
      const compressed = compressState(state);
      expect(compressed.__p).toHaveLength(2); // 2 unique frames
    });
  });
});
