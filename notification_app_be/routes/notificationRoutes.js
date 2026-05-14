const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

// GET /api/notifications/priority-inbox — must be before /:id
router.get("/priority-inbox", controller.getPriorityInbox);

// GET /api/notifications/stream — SSE endpoint (must be before /:id)
router.get("/stream", controller.streamNotifications);

// PATCH /api/notifications/read-all — must be before /:id/read
router.patch("/read-all", controller.markAllRead);

// GET /api/notifications — list with filtering & pagination
router.get("/", controller.getAllNotifications);

// POST /api/notifications — create a notification
router.post("/", controller.createNotification);

// GET /api/notifications/:id — get one
router.get("/:id", controller.getNotificationById);

// PATCH /api/notifications/:id/read — mark read/unread
router.patch("/:id/read", controller.markNotificationRead);

// DELETE /api/notifications/:id — delete
router.delete("/:id", controller.deleteNotification);

module.exports = router;
