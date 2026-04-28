// Bone connections as [from, to] marker id pairs
export const BONES: [number, number][] = [
  // Thumb
  [8, 9], [9, 10],
  // Index
  [4, 0], [0, 12],
  // Middle
  [5, 1], [1, 13],
  // Ring
  [6, 2], [2, 14],
  // Pinky
  [7, 3], [3, 15],
];

// Finger tip ids for visual differentiation
export const TIPS = new Set([10, 12, 13, 14, 15]);
export const PALM = new Set([11]);
