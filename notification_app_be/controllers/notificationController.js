const notificationService = require("../services/notificationService");
const Log = require("../middleware/logger");

const DEFAULT_STUDENT_ID = "stu_12305020";

/**
 * GET /api/notifications
 * Get all notifications with optional filtering.
 */
async function getAllNotifications(req, res) {
  try {
    const studentId = req.query.studentId || DEFAULT_STUDENT_ID;
    const { type, read, page, limit } = req.query;

    const result = await notificationService.getAllNotifications(studentId, {
      type,
      read,
      page,
      limit,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    await Log("backend", "error", "controller", `getAllNotifications error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * GET /api/notifications/priority-inbox
 * Get priority inbox — unread + high priority notifications.
 */
async function getPriorityInbox(req, res) {
  try {
    const studentId = req.query.studentId || DEFAULT_STUDENT_ID;
    const result = await notificationService.getPriorityInbox(studentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    await Log("backend", "error", "controller", `getPriorityInbox error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * GET /api/notifications/stream
 * Server-Sent Events stream for real-time notifications.
 */
async function streamNotifications(req, res) {
  const studentId = req.query.studentId || DEFAULT_STUDENT_ID;

  await Log("backend", "info", "controller", `SSE connection opened for student: ${studentId}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected", studentId })}\n\n`);

  // Register client
  notificationService.addSSEClient(studentId, res);

  // Keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  // Cleanup on disconnect
  req.on("close", async () => {
    clearInterval(pingInterval);
    notificationService.removeSSEClient(studentId, res);
    await Log("backend", "info", "controller", `SSE connection closed for student: ${studentId}`);
  });
}

/**
 * GET /api/notifications/:id
 * Get a single notification by ID.
 */
async function getNotificationById(req, res) {
  try {
    const studentId = req.query.studentId || DEFAULT_STUDENT_ID;
    const notification = await notificationService.getNotificationById(req.params.id, studentId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "NotFound",
        message: "Notification not found",
      });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    await Log("backend", "error", "controller", `getNotificationById error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * POST /api/notifications
 * Create a new notification.
 */
async function createNotification(req, res) {
  try {
    const { studentId, type, title, message, priority } = req.body;

    if (!studentId || !type || !title || !message) {
      await Log("backend", "warn", "controller", `createNotification validation failed — missing fields`);
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "studentId, type, title, and message are required",
      });
    }

    const notification = await notificationService.createNotification({
      studentId,
      type,
      title,
      message,
      priority,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    if (error.message.includes("Invalid type") || error.message.includes("Invalid priority")) {
      await Log("backend", "warn", "controller", `createNotification validation: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: error.message,
      });
    }
    await Log("backend", "error", "controller", `createNotification error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for a student.
 */
async function markAllRead(req, res) {
  try {
    const studentId = req.body.studentId || DEFAULT_STUDENT_ID;
    const updatedCount = await notificationService.markAllRead(studentId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { updatedCount },
    });
  } catch (error) {
    await Log("backend", "error", "controller", `markAllRead error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read or unread.
 */
async function markNotificationRead(req, res) {
  try {
    const studentId = req.query.studentId || DEFAULT_STUDENT_ID;
    const { isRead } = req.body;

    if (isRead === undefined) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "isRead field is required",
      });
    }

    const result = await notificationService.markNotificationRead(
      req.params.id,
      studentId,
      Boolean(isRead)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "NotFound",
        message: "Notification not found",
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    await Log("backend", "error", "controller", `markNotificationRead error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
async function deleteNotification(req, res) {
  try {
    const studentId = req.query.studentId || DEFAULT_STUDENT_ID;
    const deleted = await notificationService.deleteNotification(req.params.id, studentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "NotFound",
        message: "Notification not found",
      });
    }

    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    await Log("backend", "error", "controller", `deleteNotification error: ${error.message}`);
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
}

module.exports = {
  getAllNotifications,
  getPriorityInbox,
  streamNotifications,
  getNotificationById,
  createNotification,
  markAllRead,
  markNotificationRead,
  deleteNotification,
};
