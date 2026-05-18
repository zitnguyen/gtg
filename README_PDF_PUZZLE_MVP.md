# Z Chess - PDF Puzzle Extraction MVP

This document describes the integrated MVP feature for automatic chess puzzle extraction and assignment inside the existing Z Chess platform.

## Architecture

- `zchess-be` (Node.js + Express + MongoDB)
  - Admin/Teacher APIs:
    - `POST /api/admin/puzzle/preview`
    - `POST /api/admin/puzzle/confirm`
    - `POST /api/admin/upload-pdf`
    - `GET /api/admin/puzzles`
    - `POST /api/admin/assign`
  - Parent/Student APIs:
    - `GET /api/student/assignments/today`
    - `POST /api/student/attempt/:puzzleId/move`
- `python-service` (FastAPI + OpenCV template matching)
  - `POST /extract-fen`
  - Returns detected `fen`, preview image (base64), confidence, debug data.
- `fezchess` (React)
  - Admin/Teacher page: `Import bài tập từ PDF`
  - Parent/Student page: `Bài tập hôm nay`

## Backend Setup (`zchess-be`)

1. Install dependencies:
   - `npm install`
2. Configure env:
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
   - `PYTHON_VISION_URL=http://localhost:8001`
3. Run:
   - `npm run dev`

## Python Service Setup (`python-service`)

1. Create venv and install:
   - `pip install -r requirements.txt`
2. Run service:
   - `python main.py`
3. Health check:
   - `GET http://localhost:8001/health`

## Frontend Setup (`fezchess`)

1. Install:
   - `npm install`
2. Run:
   - `npm run dev`

## Template Matching Notes

- Template files are expected at `python-service/templates/`.
- Required:
  - `wp.png`, `wn.png`, `wb.png`, `wr.png`, `wq.png`, `wk.png`
  - `bp.png`, `bn.png`, `bb.png`, `br.png`, `bq.png`, `bk.png`
  - `empty.png`
- For MVP, service auto-generates placeholder templates if missing.
- Replace placeholders with real piece sprites to improve recognition quality.

## Bonus features included

- Preview before save (admin)
- Manual FEN edit + remove wrong detections
- Flip board option (student board + python extraction input flag)
- Save puzzle preview image (`imagePreview`)
- Failed detection logs:
  - `zchess-be/logs/puzzle-detection-failures.log`

