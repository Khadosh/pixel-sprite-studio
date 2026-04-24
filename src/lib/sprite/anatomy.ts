import type { Frame, AnatomyConfig } from '../types';
import { findBounds, getCenterOfMass } from './transforms';

export interface BodySegments {
  neckRow: number;
  waistRow: number;
  headEndRow: number;
  torsoEndRow: number;
  isHumanoid: boolean;
  torsoLeft: number;
  torsoRight: number;
  torsoCenterCol: number;
  ankleRow: number;
  kneeRow: number;
  leftArmArea?: { startR: number; endR: number; startC: number; endC: number };
  rightArmArea?: { startR: number; endR: number; startC: number; endC: number };
  leftLegArea: { startR: number; endR: number; startC: number; endC: number };
  rightLegArea: { startR: number; endR: number; startC: number; endC: number };
  pivots: {
    leftShoulder: { r: number; c: number };
    rightShoulder: { r: number; c: number };
    leftHip: { r: number; c: number };
    rightHip: { r: number; c: number };
    leftKnee: { r: number; c: number };
    rightKnee: { r: number; c: number };
  };
}

/**
 * Analyzes a frame to find key anatomical landmarks.
 */
export function analyzeBodySegments(
  frame: Frame, 
  anatomy?: AnatomyConfig
): BodySegments {
  const size = frame.length;
  const bounds = findBounds(frame);
  const com = getCenterOfMass(frame);
  
  // Default values based on proportions (fallback)
  const bodyHeight = bounds ? (bounds.bottom - bounds.top + 1) : size;
  const defaultNeck = bounds ? Math.floor(bounds.top + bodyHeight * 0.35) : Math.floor(size * 0.35);
  const defaultWaist = bounds ? Math.floor(bounds.top + bodyHeight * 0.7) : Math.floor(size * 0.7);
  const defaultKnee = bounds ? Math.floor(bounds.top + bodyHeight * 0.85) : Math.floor(size * 0.85);
  const defaultAnkle = bounds ? Math.floor(bounds.bottom - 1) : Math.floor(size * 0.9);

  // Manual Overrides
  let neckRow = anatomy?.neckRow ?? defaultNeck;
  let waistRow = anatomy?.waistRow ?? defaultWaist;
  let kneeRow = anatomy?.kneeRow ?? defaultKnee;
  let ankleRow = anatomy?.ankleRow ?? defaultAnkle;

  if (!bounds || !com) {
    const mid = Math.floor(size / 2);
    return { 
      neckRow, 
      waistRow, 
      ankleRow,
      kneeRow,
      headEndRow: neckRow, 
      torsoEndRow: waistRow, 
      isHumanoid: false,
      torsoLeft: 0,
      torsoRight: size - 1,
      torsoCenterCol: mid,
      leftLegArea: { startR: ankleRow, endR: size - 1, startC: 0, endC: mid },
      rightLegArea: { startR: ankleRow, endR: size - 1, startC: mid + 1, endC: size - 1 },
      pivots: {
        leftShoulder: { r: neckRow, c: mid - 2 },
        rightShoulder: { r: neckRow, c: mid + 2 },
        leftHip: { r: waistRow, c: mid - 1 },
        rightHip: { r: waistRow, c: mid + 1 },
        leftKnee: { r: kneeRow, c: mid - 1 },
        rightKnee: { r: kneeRow, c: mid + 1 },
      }
    };
  }

  // Horizontal Torso Analysis
  const profile = frame.map(row => row.filter(p => p !== 0).length);
  const neckWidth = profile[neckRow] || 1;
  const waistWidth = profile[waistRow] || 1;
  
  let leftLimit = anatomy?.torsoLeft;
  let rightLimit = anatomy?.torsoRight;

  if (leftLimit === undefined || rightLimit === undefined) {
    let bestStart = bounds.left;
    let bestEnd = bounds.right;
    let maxDensity = 0;
    
    for (let r = neckRow; r <= waistRow; r++) {
      const row = frame[r];
      let start = -1, end = -1;
      for (let c = 0; c < size; c++) {
        if (row[c] !== 0) {
          if (start === -1) start = c;
          end = c;
        }
      }
      if (start !== -1) {
        const density = end - start + 1;
        if (density > maxDensity) {
          maxDensity = density;
          bestStart = start;
          bestEnd = end;
        }
      }
    }
    if (leftLimit === undefined) leftLimit = bestStart;
    if (rightLimit === undefined) rightLimit = bestEnd;
  }

  const torsoCenterCol = anatomy?.torsoCenterCol ?? Math.floor(((leftLimit || 0) + (rightLimit || 0)) / 2);

  const leftArmArea = anatomy?.leftArmArea || (bounds.left < leftLimit ? { 
    startR: neckRow, 
    endR: bounds.bottom, 
    startC: bounds.left, 
    endC: leftLimit - 1 
  } : undefined);

  const rightArmArea = anatomy?.rightArmArea || (bounds.right > rightLimit ? { 
    startR: neckRow, 
    endR: bounds.bottom, 
    startC: rightLimit + 1, 
    endC: bounds.right 
  } : undefined);

  const leftLegArea = anatomy?.leftLegArea || {
    startR: ankleRow,
    endR: bounds.bottom,
    startC: bounds.left,
    endC: torsoCenterCol
  };
  const rightLegArea = anatomy?.rightLegArea || {
    startR: ankleRow,
    endR: bounds.bottom,
    startC: torsoCenterCol + 1,
    endC: bounds.right
  };

  const maxWidth = Math.max(...profile);

  return {
    neckRow,
    waistRow,
    headEndRow: neckRow,
    torsoEndRow: waistRow,
    isHumanoid: profile[neckRow] < maxWidth * 0.9,
    torsoLeft: leftLimit || 0,
    torsoRight: rightLimit || size - 1,
    torsoCenterCol,
    ankleRow,
    kneeRow,
    leftArmArea,
    rightArmArea,
    leftLegArea,
    rightLegArea,
    pivots: {
      leftShoulder: { r: neckRow, c: leftLimit || 0 },
      rightShoulder: { r: neckRow, c: rightLimit || size - 1 },
      leftHip: { r: waistRow, c: torsoCenterCol - 1 },
      rightHip: { r: waistRow, c: torsoCenterCol + 1 },
      leftKnee: { r: kneeRow, c: torsoCenterCol - 1 },
      rightKnee: { r: kneeRow, c: torsoCenterCol + 1 },
    }
  };
}
