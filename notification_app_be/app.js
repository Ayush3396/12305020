require("dotenv").config();
const express = require("express");
const cors = require("cors");
const requestLogger = require("./middleware/requestLogger");
const notificationRoutes = require("./routes/notificationRoutes");
const Log = require("./middleware/logger");

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ─── Routes ──────────────────────────────────────────────
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Campus Notification Platform API",
    version: "1.0.0",
    endpoints: {
      notifications: "/api/notifications",
      priorityInbox: "/api/notifications/priority-inbox",
      stream: "/api/notifications/stream (SSE)",
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "NotFound", message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────
app.use(async (err, req, res, next) => {
  await Log("backend", "error", "handler", `Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: "ServerError", message: err.message });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await Log("backend", "info", "service", `Campus Notification API running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
