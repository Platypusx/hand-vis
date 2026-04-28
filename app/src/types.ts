export type MarkerPos = [number, number, number] | null;

export interface Frame {
  t: number;
  markers: MarkerPos[]; // index = marker id, length 16
}
