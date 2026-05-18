import {
  parseBestMove,
  parseInfoLine,
  scoreToCp,
} from "./evaluationParser";

/*
 * Single-instance UCI engine manager. Speaks to a Stockfish-compatible
 * worker over the standard UCI protocol. The class is intentionally framework
 * agnostic so it can be reused by the analysis board, training mode, puzzle
 * trainer, and anything else later (game review, opening explorer...).
 *
 * Lifecycle:
 *   manager.start() -> Promise<boolean>     // false when no engine is available
 *   manager.setPosition(fenOrMoves)
 *   manager.analyze({ depth?, movetime?, multipv? })
 *   manager.stop()                          // cancels current search
 *   manager.dispose()                       // tears down the worker
 *
 * Subscribers receive `{ status, lines, bestmove, error }` snapshots.
 */

const DEFAULT_OPTIONS = {
  depth: 18,
  movetime: 1500,
  multipv: 1,
  threads: 1,
  hash: 16,
};

const STATUS = Object.freeze({
  IDLE: "idle",
  STARTING: "starting",
  READY: "ready",
  THINKING: "thinking",
  STOPPED: "stopped",
  UNAVAILABLE: "unavailable",
  ERROR: "error",
});

const isBrowser = typeof window !== "undefined" && typeof Worker !== "undefined";

class EngineManager {
  constructor() {
    this.worker = null;
    this.status = STATUS.IDLE;
    this.error = null;
    this.subscribers = new Set();
    this.requestId = 0;
    this.currentLines = new Map();
    this.bestmove = null;
    this.options = { ...DEFAULT_OPTIONS };
    this.sideToMove = "w";
    this._readyResolvers = [];
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    listener(this.snapshot());
    return () => this.subscribers.delete(listener);
  }

  snapshot() {
    return {
      status: this.status,
      error: this.error,
      bestmove: this.bestmove,
      lines: Array.from(this.currentLines.values()).sort(
        (a, b) => a.multipv - b.multipv,
      ),
      sideToMove: this.sideToMove,
    };
  }

  _emit() {
    const snap = this.snapshot();
    this.subscribers.forEach((listener) => listener(snap));
  }

  async start() {
    if (!isBrowser) return false;
    if (this.status === STATUS.READY || this.status === STATUS.THINKING) {
      return true;
    }
    if (this.status === STATUS.UNAVAILABLE) return false;

    this.status = STATUS.STARTING;
    this._emit();

    try {
      this.worker = new Worker(
        new URL("./stockfishWorker.js", import.meta.url),
        { type: "classic" },
      );
    } catch (err) {
      this.status = STATUS.UNAVAILABLE;
      this.error = err?.message || "Worker creation failed";
      this._emit();
      return false;
    }

    this.worker.onmessage = (event) => this._onMessage(event);
    this.worker.onerror = (event) => this._onWorkerError(event);

    return new Promise((resolve) => {
      this._readyResolvers.push(resolve);
      // Bootstrap timeout: 5s should be plenty even on slow networks.
      window.setTimeout(() => {
        if (this.status === STATUS.STARTING) {
          this.status = STATUS.UNAVAILABLE;
          this.error = "Engine bootstrap timeout";
          this._emit();
          this._flushReady(false);
        }
      }, 5000);
    });
  }

  _flushReady(value) {
    const resolvers = this._readyResolvers.splice(0);
    resolvers.forEach((resolve) => resolve(value));
  }

  _send(command) {
    if (!this.worker) return;
    this.worker.postMessage(command);
  }

  _onWorkerError(event) {
    this.status = STATUS.ERROR;
    this.error = event?.message || "Engine worker error";
    this._emit();
    this._flushReady(false);
  }

  _onMessage(event) {
    const data = event?.data;
    if (data && typeof data === "object" && data.type === "engine:unavailable") {
      this.status = STATUS.UNAVAILABLE;
      this.error =
        "Stockfish chua duoc cai dat. Vui long copy stockfish.js + stockfish.wasm vao public/stockfish/.";
      this._emit();
      this._flushReady(false);
      return;
    }
    if (data && typeof data === "object" && data.type === "engine:ready") {
      this._send("uci");
      this._send(`setoption name Threads value ${this.options.threads}`);
      this._send(`setoption name Hash value ${this.options.hash}`);
      this._send("isready");
      return;
    }

    const line = typeof data === "string" ? data : data?.line;
    if (!line) return;

    if (line.startsWith("readyok")) {
      this.status = STATUS.READY;
      this._emit();
      this._flushReady(true);
      return;
    }

    if (line.startsWith("info ")) {
      const info = parseInfoLine(line);
      if (info && info.score) {
        const cp = scoreToCp(info.score, this.sideToMove);
        this.currentLines.set(info.multipv, {
          multipv: info.multipv,
          depth: info.depth,
          score: info.score,
          cp,
          pv: info.pv,
          nodes: info.nodes,
          nps: info.nps,
          time: info.time,
        });
        this._emit();
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      const parsed = parseBestMove(line);
      this.bestmove = parsed?.bestmove || null;
      this.status = STATUS.READY;
      this._emit();
    }
  }

  setPosition({ fen, moves } = {}) {
    if (!this.worker || this.status === STATUS.UNAVAILABLE) return;
    this.currentLines.clear();
    this.bestmove = null;
    this.sideToMove = fen ? (fen.split(" ")[1] || "w") : "w";
    if (moves && moves.length) {
      const base = fen ? `fen ${fen}` : "startpos";
      this._send(`position ${base} moves ${moves.join(" ")}`);
    } else if (fen) {
      this._send(`position fen ${fen}`);
    } else {
      this._send("position startpos");
    }
    this._emit();
  }

  analyze({ depth, movetime, multipv } = {}) {
    if (!this.worker || this.status === STATUS.UNAVAILABLE) return;
    this.stop();
    if (multipv) {
      this._send(`setoption name MultiPV value ${multipv}`);
    }
    this.status = STATUS.THINKING;
    this.requestId += 1;
    this._emit();

    const cmd = ["go"];
    if (depth) cmd.push(`depth ${depth}`);
    if (movetime) cmd.push(`movetime ${movetime}`);
    if (!depth && !movetime) cmd.push(`movetime ${this.options.movetime}`);
    this._send(cmd.join(" "));
  }

  stop() {
    if (!this.worker) return;
    if (this.status === STATUS.THINKING) {
      this._send("stop");
      this.status = STATUS.STOPPED;
      this._emit();
    }
  }

  dispose() {
    if (this.worker) {
      try {
        this._send("quit");
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }
    this.status = STATUS.IDLE;
    this.currentLines.clear();
    this.bestmove = null;
    this._emit();
  }
}

let singleton = null;

export const getEngineManager = () => {
  if (!singleton) singleton = new EngineManager();
  return singleton;
};

export const ENGINE_STATUS = STATUS;
export default EngineManager;
