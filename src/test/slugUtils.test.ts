import { describe, it, expect } from 'vitest';
import { slugify, createSpec, parseSpec } from '../lib/slugUtils';

describe('slugUtils', () => {
  describe('slugify', () => {
    it('should convert text to lowercase and replace spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters and accents', () => {
      expect(slugify('Héllö Wörld! @#$%')).toBe('hello-world');
    });

    it('should trim multiple hyphens', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });
  });

  describe('createSpec', () => {
    it('should return a slugified name if provided', () => {
      expect(createSpec('uuid-123', 'My Awesome Sprite')).toBe('my-awesome-sprite');
    });

    it('should return a temp slug with id suffix if name is missing', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      expect(createSpec(id, '')).toBe('temp-550e8400');
    });

    it('should return a temp slug with random suffix if id is also missing', () => {
      const result = createSpec('', '');
      expect(result).toMatch(/^temp-[a-z0-9]+$/);
      expect(result.length).toBeGreaterThan(5);
    });

    it('should treat "new sprite" as missing name', () => {
      expect(createSpec('12345678', 'new sprite')).toBe('temp-12345678');
    });
  });

  describe('parseSpec', () => {
    it('should extract UUID from the end of a spec', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(parseSpec(`my-sprite-${uuid}`)).toBe(uuid);
    });

    it('should extract UUID from the start of a spec', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(parseSpec(`${uuid}-my-sprite`)).toBe(uuid);
    });

    it('should return the spec itself if no UUID is present', () => {
      expect(parseSpec('my-clean-slug')).toBe('my-clean-slug');
    });

    it('should handle pure UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(parseSpec(uuid)).toBe(uuid);
    });
  });
});
