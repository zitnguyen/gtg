/**
 * Task: Realtime CRUD fan-out over Socket.IO
 * Content: After successful POST/PUT/PATCH/DELETE on /api, emit `api:crud` so clients can invalidate UI.
 * Author: DucManh-BlueOC
 */
const { emitApiCrud } = require("../realtime/socketHub");

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** @param {string} method */
function methodToAction(method) {
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "update";
  if (method === "DELETE") return "delete";
  return "mutate";
}

/** Paths that should not broadcast (tokens / session noise). */
function shouldSkipBroadcast(pathname) {
  const p = pathname.toLowerCase();
  if (p.startsWith("/api/auth/signin")) return true;
  if (p.startsWith("/api/auth/signup")) return true;
  if (p.startsWith("/api/auth/refresh")) return true;
  if (p.startsWith("/api/auth/signout")) return true;
  if (p.startsWith("/api/health")) return true;
  return false;
}

function resolvePathname(req) {
  return String(req.originalUrl || req.url || "")
    .split("?")[0]
    .trim();
}

function parseApiResource(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api") return { resource: null, segments: parts };
  return { resource: parts[1] || null, segments: parts };
}

function actorUserId(req) {
  const u = req.user;
  if (!u) return null;
  if (typeof u === "object") {
    if (u._id != null) return String(u._id);
    if (u.id != null) return String(u.id);
  }
  return null;
}

/**
 * Registers once per request; emits when the HTTP response finishes with 2xx.
 */
function crudSocketMiddleware(req, res, next) {
  if (!MUTATION_METHODS.has(req.method)) return next();

  const pathname = resolvePathname(req);
  if (!pathname.startsWith("/api/")) return next();
  if (shouldSkipBroadcast(pathname)) return next();

  res.once("finish", () => {
    try {
      const status = res.statusCode;
      if (status < 200 || status >= 300) return;

      const { resource, segments } = parseApiResource(pathname);
      const routeParams =
        req.params && typeof req.params === "object" ? { ...req.params } : {};

      emitApiCrud({
        action: methodToAction(req.method),
        method: req.method,
        path: pathname,
        resource,
        segments,
        routeParams,
        statusCode: status,
        actorUserId: actorUserId(req),
      });
    } catch (err) {
      console.error("crudSocketMiddleware finish handler", err);
    }
  });

  next();
}

module.exports = crudSocketMiddleware;
