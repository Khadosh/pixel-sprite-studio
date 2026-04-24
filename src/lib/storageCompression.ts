/**
 * Structural Deduplication (Hashing) for large state objects.
 * 
 * In pixel art editors, many frames are identical or repeated across 
 * animations and history versions. This utility identifies identical 
 * number[][] arrays and replaces them with references to a shared pool.
 */

/**
 * Compresses a state object by pooling identical nested arrays (frames).
 */
export function compressState(state: any) {
  const pool: any[] = [];
  const hashes = new Map<string, number>();

  function process(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Detect a Frame (number[][])
    if (Array.isArray(obj) && obj.length > 0 && Array.isArray(obj[0]) && typeof obj[0][0] === 'number') {
      const h = JSON.stringify(obj);
      if (hashes.has(h)) return { _p: hashes.get(h) };
      const id = pool.length;
      pool.push(obj);
      hashes.set(h, id);
      return { _p: id };
    }

    if (Array.isArray(obj)) return obj.map(process);
    
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = process(obj[key]);
    }
    return newObj;
  }

  const processed = process(state);
  return { ...processed, __p: pool };
}

/**
 * Decompresses a state object by restoring pooled arrays from references.
 */
export function decompressState(state: any) {
  const pool = state.__p;
  if (!pool) return state;

  function process(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (obj._p !== undefined) {
      return pool[obj._p];
    }

    if (Array.isArray(obj)) return obj.map(process);
    
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = process(obj[key]);
    }
    return newObj;
  }

  const { __p, ...rest } = state;
  return process(rest);
}
