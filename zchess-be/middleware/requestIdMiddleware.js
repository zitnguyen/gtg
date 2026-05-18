const crypto = require("crypto");

const REQUEST_ID_HEADER = "x-request-id";

const generateRequestId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
};

const requestIdMiddleware = (req, res, next) => {
  const incoming = String(req.headers[REQUEST_ID_HEADER] || "").trim();
  const id = incoming.length > 0 && incoming.length <= 128 ? incoming : generateRequestId();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};

module.exports = requestIdMiddleware;
module.exports.REQUEST_ID_HEADER = REQUEST_ID_HEADER;
