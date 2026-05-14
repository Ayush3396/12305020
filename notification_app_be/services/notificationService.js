const { v4: uuidv4 } = require("uuid");
const Log = require("../middleware/logger");

/**
 * In-memory data store for notifications.
 * Simulates a PostgreSQL database for the purpose of this evaluation.
 * Schema mirrors the DB design in notification_system_design.md.
 */
let notifications = [
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Placement",
    title: "Amazon Campus Drive",
    message:
      "Amazon is conducting a campus placement drive on 20th May 2026. Eligible branches: CSE, IT, ECE. CTC: 26 LPA. Register on the placement portal before 18th May.",
    isRead: false,
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Result",
    title: "Semester 6 Results Published",
    message:
      "Semester 6 examination results have been published. Log in to the student portal to view your marks and grade card.",
    isRead: false,
    priority: "high",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Event",
    title: "Tech Fest 2026 — Registrations Open",
    message:
      "Annual Tech Fest 2026 registrations are now open. Events include Hackathon, Robotics, and Quiz. Last date to register: 25th May 2026.",
    isRead: true,
    priority: "medium",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Placement",
    title: "Microsoft Off-Campus Drive",
    message:
      "Microsoft is conducting an off-campus drive for 2026 graduates. Role: Software Development Engineer. CTC: 45 LPA. Apply through the official Microsoft careers portal.",
    isRead: false,
    priority: "high",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Event",
    title: "Workshop: Cloud Computing with AWS",
    message:
      "A 2-day hands-on workshop on Cloud Computing with AWS is scheduled for 22-23 May. Free for all students. Register at the CSE department office.",
    isRead: true,
    priority: "low",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Result",
    title: "Mid-Term Exam Results — CSE 401",
    message:
      "Mid-term examination results for CSE 401 (Database Management Systems) have been uploaded. Check the LMS portal for your scores.",
    isRead: false,
    priority: "medium",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Placement",
    title: "Google Summer Internship 2026",
    message:
      "Google is offering Summer Internship 2026 positions for pre-final year students. Stipend: ₹1,50,000/month. Apply through the placement cell. Deadline: 20th May.",
    isRead: false,
    priority: "high",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    studentId: "stu_12305020",
    type: "Event",
    title: "Cultural Night — Euphoria 2026",
    message:
      "The annual Cultural Night 'Euphoria 2026' is on 28th May. Entry is free for all students with ID cards. Performances by student bands and special guest artists.",
    isRead: true,
    priority: "low",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

const VALID_TYPES = ["Placement", "Event", "Result"];
const VALID_PRIORITIES = ["low", "medium", "high"];

// SSE clients map: studentId -> array of response objects
const sseClients = new Map();

function addSSEClient(studentId, res) {
  if (!sseClients.has(studentId)) {
    sseClients.set(studentId, []);
  }
  sseClients.get(studentId).push(res);
}

function removeSSEClient(studentId, res) {
  const clients = sseClients.get(studentId) || [];
  const updated = clients.filter((c) => c !== res);
  if (updated.length === 0) {
    sseClients.delete(studentId);
  } else {
    sseClients.set(studentId, updated);
  }
}

function pushSSEToStudent(studentId, notification) {
  const clients = sseClients.get(studentId) || [];
  clients.forEach((res) => {
    res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
  });
}

// ─────────────────────────────────────────────────────────
// Service methods
// ─────────────────────────────────────────────────────────

/**
 * Get all notifications for a student with optional filtering & pagination.
 */
async function getAllNotifications(studentId, { type, read, page = 1, limit = 20 }) {
  await Log("backend", "info", "service", `Fetching notifications for student: ${studentId}`);

  let filtered = notifications.filter((n) => n.studentId === studentId);

  if (type && VALID_TYPES.includes(type)) {
    filtered = filtered.filter((n) => n.type === type);
  }

  if (read !== undefined) {
    const isRead = read === "true" || read === true;
    filtered = filtered.filter((n) => n.isRead === isRead);
  }

  // Sort by createdAt desc (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 100);
  const offset = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(offset, offset + limitNum);

  await Log(
    "backend",
    "info",
    "service",
    `Returning ${paginated.length} of ${total} notifications for student: ${studentId}`
  );

  return {
    notifications: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get a single notification by ID.
 */
async function getNotificationById(id, studentId) {
  await Log("backend", "info", "service", `Fetching notification: ${id}`);
  const notification = notifications.find(
    (n) => n.id === id && n.studentId === studentId
  );
  if (!notification) {
    await Log("backend", "warn", "service", `Notification not found: ${id}`);
    return null;
  }
  return notification;
}

/**
 * Create a new notification.
 */
async function createNotification({ studentId, type, title, message, priority = "medium" }) {
  await Log("backend", "info", "service", `Creating notification for student: ${studentId}, type: ${type}`);

  if (!VALID_TYPES.includes(type)) {
    await Log("backend", "warn", "service", `Invalid notification type: ${type}`);
    throw new Error(`Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`);
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    await Log("backend", "warn", "service", `Invalid priority: ${priority}`);
    throw new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  const newNotification = {
    id: uuidv4(),
    studentId,
    type,
    title,
    message,
    isRead: false,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification);

  // Push SSE to connected student
  pushSSEToStudent(studentId, newNotification);

  await Log("backend", "info", "service", `Created notification: ${newNotification.id}`);
  return newNotification;
}

/**
 * Mark a notification as read/unread.
 */
async function markNotificationRead(id, studentId, isRead) {
  await Log("backend", "info", "service", `Marking notification ${id} as isRead: ${isRead}`);

  const idx = notifications.findIndex((n) => n.id === id && n.studentId === studentId);
  if (idx === -1) {
    await Log("backend", "warn", "service", `Notification not found for read update: ${id}`);
    return null;
  }

  notifications[idx].isRead = isRead;
  notifications[idx].updatedAt = new Date().toISOString();

  return {
    id: notifications[idx].id,
    isRead: notifications[idx].isRead,
    updatedAt: notifications[idx].updatedAt,
  };
}

/**
 * Delete a notification.
 */
async function deleteNotification(id, studentId) {
  await Log("backend", "info", "service", `Deleting notification: ${id}`);

  const idx = notifications.findIndex((n) => n.id === id && n.studentId === studentId);
  if (idx === -1) {
    await Log("backend", "warn", "service", `Notification not found for deletion: ${id}`);
    return false;
  }

  notifications.splice(idx, 1);
  await Log("backend", "info", "service", `Deleted notification: ${id}`);
  return true;
}

/**
 * Mark all notifications as read for a student.
 */
async function markAllRead(studentId) {
  await Log("backend", "info", "service", `Marking all notifications as read for student: ${studentId}`);

  let updatedCount = 0;
  const now = new Date().toISOString();
  notifications = notifications.map((n) => {
    if (n.studentId === studentId && !n.isRead) {
      updatedCount++;
      return { ...n, isRead: true, updatedAt: now };
    }
    return n;
  });

  await Log("backend", "info", "service", `Marked ${updatedCount} notifications as read for student: ${studentId}`);
  return updatedCount;
}

/**
 * Get priority inbox — unread + high priority, sorted newest first.
 */
async function getPriorityInbox(studentId) {
  await Log("backend", "info", "service", `Fetching priority inbox for student: ${studentId}`);

  const priorityNotifications = notifications
    .filter((n) => n.studentId === studentId && !n.isRead && n.priority === "high")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  await Log(
    "backend",
    "info",
    "service",
    `Priority inbox has ${priorityNotifications.length} items for student: ${studentId}`
  );

  return {
    notifications: priorityNotifications,
    total: priorityNotifications.length,
  };
}

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markNotificationRead,
  deleteNotification,
  markAllRead,
  getPriorityInbox,
  addSSEClient,
  removeSSEClient,
  pushSSEToStudent,
};
