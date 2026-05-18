import { Chess } from "chess.js";

export const swapTurnInFen = (fen) => {
  const parts = String(fen || "").split(" ");
  if (parts.length < 2) return fen;
  parts[1] = parts[1] === "w" ? "b" : "w";
  return parts.join(" ");
};

export const isLichessLink = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return /(^|\.)lichess\.org$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

export const createChessGame = (fen) => {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch {
    return new Chess();
  }
};

export const buildVideoEmbedUrl = (content) => {
  if (!content) return "";
  if (content.includes("watch?v=")) {
    return content.replace("watch?v=", "embed/");
  }
  if (content.includes("youtu.be/")) {
    return content.replace("youtu.be/", "youtube.com/embed/");
  }
  return content;
};
