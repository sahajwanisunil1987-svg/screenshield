import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import router from "./routes/index.js";

export const app = express();

const allowedOrigins = Array.from(new Set([env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"]));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sparekart-api" });
});

app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandler);
