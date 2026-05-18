// Web-Audio synthesised chess sounds. We avoid bundling sound files so the
// trainer works offline and bundle size stays small. Tones are short, layered
// and EQ-shaped to evoke the wood-on-wood feel of premium chess UIs.

let audioContext = null;
let muted = false;

const getContext = () => {
  if (typeof window === "undefined") return null;
  if (muted) return null;
  if (audioContext) return audioContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
  } catch {
    audioContext = null;
  }
  return audioContext;
};

const playTone = ({
  frequency = 440,
  duration = 0.08,
  volume = 0.18,
  type = "sine",
  attack = 0.005,
  decay = 0.04,
} = {}) => {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + duration + decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + attack + duration + decay + 0.02);
};

const layered = (tones) => {
  tones.forEach((opts, idx) => {
    setTimeout(() => playTone(opts), idx * 18);
  });
};

export const setSoundMuted = (next) => {
  muted = Boolean(next);
};

export const isSoundMuted = () => muted;

export const playMoveSound = () =>
  layered([
    { frequency: 220, duration: 0.06, volume: 0.22, type: "triangle" },
    { frequency: 330, duration: 0.05, volume: 0.12, type: "sine" },
  ]);

export const playCaptureSound = () =>
  layered([
    { frequency: 180, duration: 0.06, volume: 0.28, type: "sawtooth" },
    { frequency: 90, duration: 0.12, volume: 0.18, type: "sine" },
  ]);

export const playCheckSound = () =>
  layered([
    { frequency: 540, duration: 0.06, volume: 0.18, type: "square" },
    { frequency: 720, duration: 0.06, volume: 0.14, type: "square" },
  ]);

export const playCorrectSound = () =>
  layered([
    { frequency: 660, duration: 0.06, volume: 0.18, type: "triangle" },
    { frequency: 880, duration: 0.08, volume: 0.18, type: "triangle" },
  ]);

export const playWrongSound = () =>
  layered([
    { frequency: 220, duration: 0.08, volume: 0.22, type: "sawtooth" },
    { frequency: 110, duration: 0.16, volume: 0.18, type: "sine" },
  ]);

export const playGameEndSound = () =>
  layered([
    { frequency: 440, duration: 0.12, volume: 0.18, type: "triangle" },
    { frequency: 660, duration: 0.12, volume: 0.18, type: "triangle" },
    { frequency: 880, duration: 0.18, volume: 0.18, type: "triangle" },
  ]);

export const playSoundForMove = (move) => {
  if (!move) return;
  if (move.captured) return playCaptureSound();
  if (move.san?.includes("#")) return playGameEndSound();
  if (move.san?.includes("+")) return playCheckSound();
  return playMoveSound();
};
