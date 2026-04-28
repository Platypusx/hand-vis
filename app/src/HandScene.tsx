import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { Frame, MarkerPos } from "./types";
import { BONES, TIPS, PALM } from "./hand";

interface Props {
  frames: Frame[];
  frameIndex: number;
  offset: [number, number, number];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

function markerColor(id: number, selected: boolean): string {
  if (selected) return "#ffffff";
  if (PALM.has(id)) return "#ffcc00";
  if (TIPS.has(id)) return "#ff4444";
  return "#44aaff";
}

function apply(pos: MarkerPos, offset: [number, number, number]): MarkerPos {
  if (!pos) return null;
  return [pos[0] + offset[0], pos[1] + offset[1], pos[2] + offset[2]];
}

function Marker({
  pos, id, selected, onSelect,
}: {
  pos: MarkerPos;
  id: number;
  selected: boolean;
  onSelect: (id: number | null) => void;
}) {
  if (!pos) return null;
  return (
    <mesh
      position={pos}
      onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : id); }}
    >
      <sphereGeometry args={[selected ? 0.008 : 0.005, 16, 16]} />
      <meshStandardMaterial color={markerColor(id, selected)} emissive={selected ? "#ffffff" : "#000000"} emissiveIntensity={selected ? 0.3 : 0} />
    </mesh>
  );
}

function Bone({ a, b }: { a: MarkerPos; b: MarkerPos }) {
  if (!a || !b) return null;
  const points = useMemo(
    () => [new THREE.Vector3(...a), new THREE.Vector3(...b)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...a, ...b]
  );
  return <Line points={points} color="#888888" lineWidth={1.5} />;
}

export function HandScene({ frames, frameIndex, offset, selectedId, onSelect }: Props) {
  const frame = frames[frameIndex];
  if (!frame) return null;

  const shifted = frame.markers.map((pos) => apply(pos, offset));

  return (
    <group onClick={(e) => { if (e.object.type === "Mesh") return; onSelect(null); }}>
      {shifted.map((pos, id) => (
        <Marker key={id} pos={pos} id={id} selected={selectedId === id} onSelect={onSelect} />
      ))}
      {BONES.map(([a, b]) => (
        <Bone key={`${a}-${b}`} a={shifted[a]} b={shifted[b]} />
      ))}
    </group>
  );
}
