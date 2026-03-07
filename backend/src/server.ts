import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { app } from "./app.js";

const start = async () => {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(`SpareKart API listening on http://localhost:${env.PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
