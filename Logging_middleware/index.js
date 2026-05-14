const Log = require("./logger");

Log(
  "backend",
  "info",
  "service",
  "User login successful"
);

Log(
  "backend",
  "warn",
  "db",
  "Critical database failure"
);

Log(
  "backend",
  "error",
  "handler",
  "received string expected  boolean"
);
