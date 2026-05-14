const axios = require("axios");
require("dotenv").config({ path: require("path").join(__dirname, "../Logging_middleware/.env") });

const TOKEN = process.env.TOKEN;
const LOG_URL = "http://4.224.186.213/evaluation-service/logs";

/**
 * Log function — sends structured logs to the Afford Medical evaluation service.
 * @param {string} stack - e.g. "backend"
 * @param {string} level - "info" | "warn" | "error"
 * @param {string} packageName - e.g. "controller", "service", "middleware"
 * @param {string} message - human-readable log message
 */
async function Log(stack, level, packageName, message) {
  const data = { stack, level, package: packageName, message };

  try {
    const response = await axios.post(LOG_URL, data, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    // Do not use console.log in middleware per evaluation rules —
    // returning response data for internal use only
    return response.data;
  } catch (error) {
    // Silently fail — logging should never crash the main app
    return null;
  }
}

module.exports = Log;
