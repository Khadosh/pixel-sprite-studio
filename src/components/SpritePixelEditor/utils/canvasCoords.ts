export function getPixelCoords(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  pixelScale: number
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  return {
    row: Math.floor(y / pixelScale),
    col: Math.floor(x / pixelScale),
    floatR: y / pixelScale,
    floatC: x / pixelScale
  };
}
