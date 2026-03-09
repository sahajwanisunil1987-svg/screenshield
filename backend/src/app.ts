import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import * as paymentController from "./controllers/payment.controller.js";
import { healthCheck } from "./controllers/health.controller.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import router from "./routes/index.js";

export const app = express();

const allowedOrigins = Array.from(new Set([env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"]));

app.set("trust proxy", 1);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(requestContext);
app.post("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }), paymentController.webhook);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", healthCheck);

app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandler);
