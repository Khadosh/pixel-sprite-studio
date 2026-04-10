export const getNextAnimationName = (existing: { name: string }[], type: string): { name: string; label: string } => {
  const baseName = type.toLowerCase();
  const baseLabel = type.toUpperCase();
  const existingNames = existing.map(a => a.name);
  if (!existingNames.includes(baseName)) {
    return { name: baseName, label: baseLabel };
  }
  let i = 1;
  while (existingNames.includes(`${baseName}_${i}`)) i++;
  return { name: `${baseName}_${i}`, label: `${baseLabel} ${i}` };
};

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as any;
  const clone = {} as any;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
