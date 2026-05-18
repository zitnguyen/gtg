/* eslint-env worker */
/*
 * Stockfish worker bootstrap.
 *
 * The worker tries to load Stockfish from a few well-known locations in order:
 *   1. /stockfish/stockfish.js (self-hosted under fezchess/public/stockfish)
 *   2. CDN fallbacks (jsDelivr / Lichess CDN)
 *
 * If all fail, it reports back "engine:unavailable" so the UI can show a
 * graceful empty state instead of crashing. Drop a real Stockfish build into
 * `fezchess/public/stockfish/stockfish.js` (and its `.wasm`) for production.
 */

const STOCKFISH_URLS = [
  "/stockfish/stockfish.js",
  "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js",
  "https://lichess1.org/assets/lifat/stockfish/stockfish.js",
];

let bootstrapped = false;

const tryLoad = (url) => {
  try {
    // eslint-disable-next-line no-undef
    self.importScripts(url);
    return true;
  } catch {
    return false;
  }
};

for (const url of STOCKFISH_URLS) {
  if (tryLoad(url)) {
    bootstrapped = true;
    break;
  }
}

if (!bootstrapped) {
  self.postMessage({ type: "engine:unavailable" });
} else {
  self.postMessage({ type: "engine:ready" });
  // Real Stockfish builds register an onmessage handler on `self` and forward
  // UCI commands directly. Nothing else to do here.
}
