# Stockfish runtime

This folder is reserved for a Stockfish UCI engine build that the analysis
board, training mode and puzzle trainer load at runtime.

## Quick install

1. Download a Stockfish JS/WASM build, e.g.
   `https://github.com/lichess-org/stockfish.wasm/releases` or
   `https://www.npmjs.com/package/stockfish`.
2. Copy the following files into `fezchess/public/stockfish/`:
   - `stockfish.js`
   - `stockfish.wasm` (and any `.worker.js` / pthread shards if applicable)
3. Reload the app. The engine will be auto-detected by
   `src/lib/chess-engine/stockfishWorker.js`.

If Stockfish is not present locally the worker falls back to a public CDN. If
all sources fail the UI shows a graceful empty state instead of crashing.

> Tip: For best performance during analysis use the WASM threaded build.
> COOP/COEP headers are required for `SharedArrayBuffer`; configure your
> hosting accordingly.
