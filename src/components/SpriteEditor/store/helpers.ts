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
