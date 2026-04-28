"""Convert PhaseSpace CSV files to JSON for the hand visualizer."""
import csv
import json
import sys
from pathlib import Path
from collections import defaultdict

def convert(csv_path: Path, out_path: Path):
    frames: dict[int, dict] = defaultdict(lambda: {"t": 0, "markers": {}})

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = int(row["marker_time"])
            mid = int(row["id"])
            frames[t]["t"] = t
            frames[t]["markers"][mid] = [
                float(row["position.x"]),
                float(row["position.y"]),
                float(row["position.z"]),
            ]

    sorted_frames = [frames[t] for t in sorted(frames)]
    # Normalise: convert marker dict keys to ints already done; serialise as list-of-lists
    output = []
    for f in sorted_frames:
        # markers as array indexed by id (None if missing)
        marker_list = [f["markers"].get(i) for i in range(16)]
        output.append({"t": f["t"], "markers": marker_list})

    out_path.write_text(json.dumps(output, separators=(",", ":")))
    print(f"Wrote {len(output)} frames to {out_path}")

if __name__ == "__main__":
    paths = sys.argv[1:] if len(sys.argv) > 1 else list(Path("data").glob("*.csv"))
    for p in paths:
        p = Path(p)
        convert(p, Path("app/public") / (p.stem + ".json"))
