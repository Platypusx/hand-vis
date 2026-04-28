"""Hand tracking data server — serves CSV files from ./data/ as JSON frames."""
import csv
from pathlib import Path
from collections import defaultdict

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

DATA_DIR = Path(__file__).parent / "data"

app = FastAPI()


def csv_to_frames(path: Path) -> list:
    by_t: dict[int, dict] = defaultdict(lambda: [None] * 16)
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = int(row["marker_time"])
            mid = int(row["id"])
            by_t[t][mid] = [
                float(row["position.x"]),
                float(row["position.y"]),
                float(row["position.z"]),
            ]
    return [{"t": t, "markers": by_t[t]} for t in sorted(by_t)]


@app.get("/files")
def list_files():
    return [p.name for p in sorted(DATA_DIR.glob("*.csv"))]


@app.get("/data/{filename}")
def get_data(filename: str):
    if "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400)
    path = DATA_DIR / filename
    if not path.exists() or path.suffix != ".csv":
        raise HTTPException(status_code=404)
    return JSONResponse(csv_to_frames(path))
