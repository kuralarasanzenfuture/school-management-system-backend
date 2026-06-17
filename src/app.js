import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
// import { attachDb } from "./middlewares/dbMiddleware.js";
import routes from "./routes/index-routes.js";
// import { getLocalIP } from "./server.js";

import {
  errorHandler,
  globalErrorHandler,
} from "./middlewares/error.middleware.js";

import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

// ------------------------------------------------------------------
// App & dirname setup (IMPORTANT for ES Modules)
// ------------------------------------------------------------------
const app = express();

app.set("trust proxy", true);

app.use(cookieParser());

// start cron job ONCE
// startCleanupJob();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------------------
// Global Middlewares
// ------------------------------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // `http://${getLocalIP()}:${process.env.FRONTEND_PORT}`,
      `http://localhost:${process.env.FRONTEND_PORT}`,
      process.env.FRONTEND_URL, // from .env
    ].filter(Boolean), // removes undefined if not set
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------------
// Static Files
// ------------------------------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------------------------------------------------------
// API Routes
// ------------------------------------------------------------------

app.use("/api", routes);

// ------------------------------------------------------------------
// Health Check (optional but recommended)
// ------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.send("API Server Running");
});

// ------------------------------------------------------------------
// Error Handler (ALWAYS LAST)
// ------------------------------------------------------------------
app.use(errorHandler);
app.use(globalErrorHandler);

export default app;
