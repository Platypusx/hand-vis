import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { HandScene } from "./HandScene";
import type { Frame } from "./types";

const API = "";

// Marker IDs in priority order for centering anchor
const ANCHOR_PRIORITY = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15];
const Y_OFFSET = 0.2; // place anchor slightly above y=0

function computeOffset(frames: Frame[]): [number, number, number] {
  if (frames.length === 0) return [0, 0, 0];
  const first = frames[0].markers;
  for (const id of ANCHOR_PRIORITY) {
    const pos = first[id];
    if (pos) return [-pos[0], Y_OFFSET - pos[1], -pos[2]];
  }
  return [0, 0, 0];
}

const MARKER_LABELS: Record<number, string> = {
  0: "Index MCP", 1: "Middle MCP", 2: "Ring MCP", 3: "Pinky MCP",
  4: "Index base", 5: "Middle base", 6: "Ring base", 7: "Pinky base",
  8: "Thumb tip", 9: "Thumb mid", 10: "Thumb base",
  11: "Back of hand",
  12: "Index tip", 13: "Middle tip", 14: "Ring tip", 15: "Pinky tip",
};

export default function App() {
  const [fileList, setFileList] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null);

  const accRef = useRef(0);
  const lastTRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const framesRef = useRef(frames);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  useEffect(() => { framesRef.current = frames; }, [frames]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    fetch(`${API}/files`)
      .then((r) => r.json())
      .then((list: string[]) => {
        setFileList(list);
        if (list.length > 0) setSelected(list[0]);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setPlaying(false);
    setFrameIndex(0);
    setSelectedMarkerId(null);
    accRef.current = 0;
    setLoading(true);
    fetch(`${API}/data/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((data: Frame[]) => {
        setFrames(data);
        setLoading(false);
      });
  }, [selected]);

  const offset = useMemo(() => computeOffset(frames), [frames]);

  const tick = useCallback((now: number) => {
    if (!playingRef.current) return;
    const fs = framesRef.current;
    if (fs.length < 2) return;

    if (lastTRef.current === null) lastTRef.current = now;
    const delta = now - lastTRef.current;
    lastTRef.current = now;
    accRef.current += delta * speedRef.current;

    const startT = fs[0].t;
    const targetT = startT + accRef.current;

    let lo = 0, hi = fs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (fs[mid].t < targetT) lo = mid + 1;
      else hi = mid;
    }

    if (lo >= fs.length - 1) {
      setFrameIndex(fs.length - 1);
      setPlaying(false);
      lastTRef.current = null;
      accRef.current = 0;
      return;
    }

    setFrameIndex(lo);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      lastTRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  const totalFrames = frames.length;
  const startT = frames[0]?.t ?? 0;
  const endT = frames[totalFrames - 1]?.t ?? 1;
  const currentT = frames[frameIndex]?.t ?? 0;
  const elapsedMs = currentT - startT;

  // Raw (pre-offset) position of the selected marker in the current frame
  const selectedRawPos = selectedMarkerId !== null ? frames[frameIndex]?.markers[selectedMarkerId] : null;
  const selectedShiftedPos = selectedRawPos
    ? ([selectedRawPos[0] + offset[0], selectedRawPos[1] + offset[1], selectedRawPos[2] + offset[2]] as [number, number, number])
    : null;

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = Number(e.target.value);
    setFrameIndex(idx);
    accRef.current = (frames[idx]?.t ?? startT) - startT;
    lastTRef.current = null;
  }

  function togglePlay() {
    if (frameIndex >= totalFrames - 1) {
      setFrameIndex(0);
      accRef.current = 0;
    }
    setPlaying((p) => !p);
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111", display: "flex", flexDirection: "column", position: "relative" }}>
      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [0, 0.8, 0.8], fov: 50, near: 0.001, far: 100 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 2, 2]} intensity={0.8} />
        <HandScene
          frames={frames}
          frameIndex={frameIndex}
          offset={offset}
          selectedId={selectedMarkerId}
          onSelect={setSelectedMarkerId}
        />
        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport />
        </GizmoHelper>
        <gridHelper args={[2, 20, "#333", "#222"]} />
      </Canvas>

      {/* Marker info panel */}
      {selectedMarkerId !== null && (
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(20,20,20,0.92)", border: "1px solid #444",
          borderRadius: 6, padding: "12px 16px",
          fontFamily: "monospace", fontSize: 13, color: "#ccc",
          minWidth: 220, pointerEvents: "none",
        }}>
          <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 8 }}>
            Marker {selectedMarkerId} — {MARKER_LABELS[selectedMarkerId] ?? "unknown"}
          </div>
          {selectedRawPos ? (
            <>
              <div style={{ color: "#888", marginBottom: 4 }}>raw (world)</div>
              <div>x: <span style={{ color: "#44aaff" }}>{selectedRawPos[0].toFixed(5)}</span></div>
              <div>y: <span style={{ color: "#44aaff" }}>{selectedRawPos[1].toFixed(5)}</span></div>
              <div>z: <span style={{ color: "#44aaff" }}>{selectedRawPos[2].toFixed(5)}</span></div>
              <div style={{ color: "#888", margin: "8px 0 4px" }}>centred</div>
              <div>x: <span style={{ color: "#aaffaa" }}>{selectedShiftedPos![0].toFixed(5)}</span></div>
              <div>y: <span style={{ color: "#aaffaa" }}>{selectedShiftedPos![1].toFixed(5)}</span></div>
              <div>z: <span style={{ color: "#aaffaa" }}>{selectedShiftedPos![2].toFixed(5)}</span></div>
              <div style={{ color: "#888", marginTop: 8 }}>t: {frames[frameIndex]?.t}</div>
            </>
          ) : (
            <div style={{ color: "#666" }}>not present in this frame</div>
          )}
        </div>
      )}

      <div style={{
        padding: "12px 16px",
        background: "#1a1a1a",
        borderTop: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "monospace",
        color: "#ccc",
        fontSize: 13,
        userSelect: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ whiteSpace: "nowrap" }}>File:</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ flex: 1, background: "#2a2a2a", color: "#ccc", border: "1px solid #444", padding: "3px 6px", fontFamily: "monospace", fontSize: 13 }}
          >
            {fileList.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {loading && <span style={{ color: "#888" }}>loading…</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={togglePlay}
            disabled={totalFrames === 0}
            style={{ background: "#333", color: "#fff", border: "1px solid #555", padding: "4px 14px", cursor: "pointer", borderRadius: 4, fontSize: 16 }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={frameIndex}
            onChange={handleScrub}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 110, textAlign: "right" }}>
            {(elapsedMs / 1000).toFixed(2)}s / {((endT - startT) / 1000).toFixed(2)}s
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ minWidth: 90 }}>Speed: {speed.toFixed(2)}×</span>
          <input
            type="range" min={0.1} max={4} step={0.05} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: 160 }}
          />
          <span style={{ color: "#555", marginLeft: "auto" }}>
            frame {totalFrames ? frameIndex + 1 : 0} / {totalFrames}
          </span>
        </div>
      </div>
    </div>
  );
}
