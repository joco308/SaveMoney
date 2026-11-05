import "./config/serialization";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { apiRouter } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin:
      env.CORS_ORIGIN === "*"
        ? "*"
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "SaveMoney API",
      version: "1.0.0",
    },
  });
});

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
