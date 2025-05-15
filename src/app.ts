import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  performanceMonitor,
} from "./middlewares";
import logger from "./utils/logger";
import filmRoutes from "./routes/film-routes";
import userRoutes from "./routes/user-routes";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(
      helmet({
        contentSecurityPolicy:
          process.env.NODE_ENV === "production" ? undefined : false,
      })
    );

    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Request-Id",
          "X-User-Id",
        ],
      })
    );

    this.app.use(compression());

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    this.app.use(requestLogger);
    this.app.use(performanceMonitor);
    this.app.set("trust proxy", true);
  }

  private initializeRoutes(): void {
    this.app.use("/api/v1", filmRoutes);
    this.app.use("/api/v1", userRoutes);

    this.app.get("/", (_req, res) => {
      res.json({
        message: "Polariod Light API",
        version: process.env.API_VERSION || "1.0.0",
        docs: "/api/docs",
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);

    this.app.use(errorHandler);
  }

  public listen(): void {
    const port = process.env.PORT || 3000;

    this.app.listen(port, () => {
      logger.info(`Server started`, {
        port,
        environment: process.env.NODE_ENV,
        pid: process.pid,
      });
    });
  }

}

export default App;
