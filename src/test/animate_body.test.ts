import { describe, it, expect, vi } from 'vitest';
import { animate_body } from '../lib/sprite/generators/animate_body';
import type { Frame, AnatomyConfig, MemberType } from '../lib/types';
import * as anatomyResolver from '../lib/sprite/anatomyResolver';

// Mock resolveMembers so we don't trigger the algorithmic fallback
vi.mock('../lib/sprite/anatomyResolver', () => ({
  resolveMembers: vi.fn()
}));

describe('animate_body Builder', () => {
  // Creamos un frame de 5x5 para las pruebas
  const createEmptyFrame = (): Frame => [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ];

  it('should shift a single member correctly', () => {
    const base = createEmptyFrame();
    base[1][1] = 1; // Head pixel
    base[2][1] = 2; // Torso pixel

    vi.mocked(anatomyResolver.resolveMembers).mockReturnValue({
      head: { type: 'head', pixels: [{ r: 1, c: 1 }], pivot: {r:1, c:1}, bounds: null as any },
      torso: { type: 'torso', pixels: [{ r: 2, c: 1 }], pivot: {r:2, c:1}, bounds: null as any }
    } as any);

    const result = animate_body(base, {} as any, 0)
      .desplazar('head', 1, 1) // down 1, right 1
      .build();

    expect(result[2][2]).toBe(1);
    expect(result[2][1]).toBe(2);
    expect(result[1][1]).toBe(0);
  });

  it('should support array of members for desplazar', () => {
    const base = createEmptyFrame();
    base[1][1] = 1; // arm left
    base[1][3] = 2; // arm right

    vi.mocked(anatomyResolver.resolveMembers).mockReturnValue({
      arm_left: { type: 'arm_left', pixels: [{ r: 1, c: 1 }], pivot: {r:1, c:1}, bounds: null as any },
      arm_right: { type: 'arm_right', pixels: [{ r: 1, c: 3 }], pivot: {r:1, c:3}, bounds: null as any }
    } as any);

    const result = animate_body(base, {} as any, 0)
      .desplazar(['arm_left', 'arm_right'], 1, 0)
      .build();

    expect(result[2][1]).toBe(1);
    expect(result[2][3]).toBe(2);
    expect(result[1][1]).toBe(0);
    expect(result[1][3]).toBe(0);
  });

  it('should allow chaining multiple transformations', () => {
    const base = createEmptyFrame();
    base[1][1] = 1; // head
    base[2][1] = 2; // torso
    base[3][1] = 3; // legs

    vi.mocked(anatomyResolver.resolveMembers).mockReturnValue({
      head: { type: 'head', pixels: [{ r: 1, c: 1 }], pivot: {r:1, c:1}, bounds: null as any },
      torso: { type: 'torso', pixels: [{ r: 2, c: 1 }], pivot: {r:2, c:1}, bounds: null as any },
      leg_left: { type: 'leg_left', pixels: [{ r: 3, c: 1 }], pivot: {r:3, c:1}, bounds: null as any }
    } as any);

    const result = animate_body(base, {} as any, 0)
      .desplazar('head', -1, 0) // UP 1 -> (0,1)
      .desplazar('torso', 1, 0) // DOWN 1 -> (3,1)
      .build();

    expect(result[0][1]).toBe(1); // head moved up
    expect(result[3][1]).toBe(3); // leg_left drawn over torso
  });
});
