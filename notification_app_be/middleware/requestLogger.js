const Log = require("./logger");

/**
 * Express request logging middleware.
 * Logs every incoming request to the evaluation logging service.
 */
async function requestLogger(req, res, next) {
  const start = Date.now();

  // Log the incoming request
  await Log(
    "backend",
    "info",
    "middleware",
    `Incoming ${req.method} ${req.originalUrl} — body: ${JSON.stringify(req.body)}`
  );

  // Hook into response finish to log the outcome
  res.on("finish", async () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    await Log(
      "backend",
      level,
      "middleware",
      `Completed ${req.method} ${req.originalUrl} — status: ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

module.exports = requestLogger;
