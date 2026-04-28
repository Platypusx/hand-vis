# hand-vis

3D visualizer for PhaseSpace hand tracking data. Renders 16 optical markers as an animated hand skeleton in the browser using React Three Fiber.

![16 markers connected as finger bones, orbitable 3D view with playback controls]

## Features

- Animated 3D playback at real capture rate (~1 kHz), with adjustable speed
- Orbit, zoom, and pan the scene freely
- Select any marker to inspect its raw and centred coordinates live
- Scene is centred on the back-of-hand marker (id 11) at startup
- Drop new CSV files into `data/` — they appear in the file selector on refresh

## Marker topology

| ID | Joint |
|----|-------|
| 0 | Index MCP |
| 1 | Middle MCP |
| 2 | Ring MCP |
| 3 | Pinky MCP |
| 4 | Index base |
| 5 | Middle base |
| 6 | Ring base |
| 7 | Pinky base |
| 8 | Thumb tip |
| 9 | Thumb mid |
| 10 | Thumb base |
| 11 | Back of hand |
| 12 | Index tip |
| 13 | Middle tip |
| 14 | Ring tip |
| 15 | Pinky tip |

Bone connections: `8–9–10` (thumb), `4–0–12` (index), `5–1–13` (middle), `6–2–14` (ring), `7–3–15` (pinky).

## Data format

CSV files with the following columns (PhaseSpace export format):

```
phasespace_timestamp, system_timestamp, id, marker_time, condition, position.x, position.y, position.z
```

Place CSV files in the `data/` directory.

## Running

### Docker (recommended)

```bash
docker compose up --build
```

Open `http://localhost`. The `data/` directory is mounted as a live volume — new CSVs appear after a browser refresh without rebuilding.

### Local development

**Backend** (Python 3.10+):

```bash
pip install fastapi uvicorn
uvicorn server:app --port 8000 --reload
```

**Frontend** (Node 18+):

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:5173` (or whichever port Vite picks).

## Project structure

```
hand-vis/
├── data/                  # CSV files (mounted into backend)
├── app/                   # Vite + React + TypeScript frontend
│   └── src/
│       ├── App.tsx        # Layout, playback logic, file selection
│       ├── HandScene.tsx  # React Three Fiber scene (markers + bones)
│       ├── hand.ts        # Bone topology and marker sets
│       └── types.ts       # Shared types
├── server.py              # FastAPI backend (serves file list + converts CSV → JSON)
├── convert.py             # Standalone CSV → JSON batch converter
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf             # Reverse proxy for production frontend
└── docker-compose.yml
```
