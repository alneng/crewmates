import express from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "./config";
import { toNodeHandler } from "better-auth/node";
import { auth, authHandler } from "./utils/auth";
import apiRouter from "./api";
import { errorHandler } from "./utils/errors.utils";

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// better-auth
app.all("/api/auth/*", toNodeHandler(auth));
app.use(authHandler);

// Middleware (must be after better-auth routes)
app.use(express.json());

// Routes
app.use("/api", apiRouter);

// Error handling
app.use(errorHandler);

export default app;
