
import { Frame } from '../src/lib/types';

// Simplified version of the logic to test against the user's data
function analyzeBodySegmentsTest(frame: number[][]) {
  const size = frame.length;
  const profile = frame.map(row => row.filter(p => p !== 0).length);
  
  // Find neck/waist (simplified)
  let neckRow = 0;
  let maxW = 0;
  profile.forEach((w, r) => { if(w > maxW) { maxW = w; } });
  
  // Humanoids usually have head (top), neck (dip), torso (wider)
  // Finding the first significant dip after the head
  let headFound = false;
  for(let r=0; r<size; r++) {
    if (profile[r] > 0) headFound = true;
    if (headFound && profile[r] < profile[r-1] * 0.9) {
      neckRow = r;
      break;
    }
  }
  
  const waistRow = neckRow + Math.floor((size - neckRow) * 0.4);
  const torsoRows = frame.slice(neckRow, waistRow + 1);
  const verticalTorsoProfile = new Array(size).fill(0);
  
  torsoRows.forEach(row => {
    row.forEach((p, c) => { if (p !== 0) verticalTorsoProfile[c]++; });
  });

  const maxTorsoDensity = Math.max(...verticalTorsoProfile);
  const coreThreshold = Math.max(1, Math.floor(maxTorsoDensity * 0.7));

  // Find center of mass for horizontal reference
  let sumC = 0, count = 0;
  frame.forEach((row, r) => row.forEach((p, c) => { if(p!==0){ sumC += c; count++; } }));
  const centerCol = Math.floor(sumC / count);

  let leftLimit = centerCol;
  let rightLimit = centerCol;
  
  while (leftLimit > 0 && verticalTorsoProfile[leftLimit - 1] >= coreThreshold) leftLimit--;
  while (rightLimit < size - 1 && verticalTorsoProfile[rightLimit + 1] >= coreThreshold) rightLimit++;

  console.log('Análisis para Chinese Character:');
  console.log(`- Neck Row: ${neckRow}`);
  console.log(`- Waist Row: ${waistRow}`);
  console.log(`- Core Span: Cols ${leftLimit} to ${rightLimit}`);
  console.log(`- Vertical Torso Profile:`, verticalTorsoProfile.join(','));
  
  if (leftLimit > 0 && verticalTorsoProfile.slice(0, leftLimit).some(v => v > 0)) {
    console.log(`- BRAZO IZQUIERDO DETECTADO: Cols 0 a ${leftLimit-1}`);
  }
  if (rightLimit < size - 1 && verticalTorsoProfile.slice(rightLimit + 1).some(v => v > 0)) {
    console.log(`- BRAZO DERECHO DETECTADO: Cols ${rightLimit+1} a ${size-1}`);
  }
}

// User's Frame 0 (Chinese Character)
const frame0 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,11,13,11,10,10,0,0,0,0,0,10,10,11,13,11,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,11,10,10,10,10,10,10,10,0,10,10,10,10,10,10,10,11,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,10,10,10,11,10,10,10,11,12,11,10,10,10,11,10,10,10,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,10,10,10,10,11,13,13,14,13,13,11,10,10,10,10,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,10,11,13,13,14,14,14,13,13,11,10,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,11,12,12,12,13,13,13,12,12,12,11,10,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,11,12,11,11,11,11,11,11,11,11,11,12,11,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,11,11,10,34,35,36,11,36,35,34,10,11,11,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,10,34,35,36,39,39,39,36,35,34,10,10,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,10,35,36,39,39,40,39,39,36,35,10,10,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,39,11,11,11,36,36,36,11,11,11,39,10,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,36,41,10,41,35,39,36,41,10,41,36,10,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,10,34,39,10,10,36,40,36,10,10,39,34,10,0,0,0,0,0,0,0,0,0],
  // ... (rest assumed similar for test)
];

analyzeBodySegmentsTest(frame0);
