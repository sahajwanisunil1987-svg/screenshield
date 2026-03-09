import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { app } from "./app.js";

const shutdown = async (signal: string) => {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      message: "Shutdown signal received",
      signal
    })
  );

  await prisma.$disconnect();
  process.exit(0);
};

const start = async () => {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        message: "SpareKart API started",
        port: env.PORT,
        environment: env.NODE_ENV
      })
    );
  });
};

start().catch((error) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      message: "Failed to start server",
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exit(1);
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      message: "Unhandled promise rejection",
      reason: reason instanceof Error ? reason.message : String(reason)
    })
  );
});

process.on("uncaughtException", (error) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      message: "Uncaught exception",
      error: error.message
    })
  );
  process.exit(1);
});
