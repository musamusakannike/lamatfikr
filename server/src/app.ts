import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { stripeWebhookRouter } from "./routes/stripe";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { profileRouter } from "./routes/profile";
import { verificationRouter } from "./routes/verification";
import { socialRouter } from "./routes/social";
import { postsRouter } from "./routes/posts";
import { uploadRouter } from "./routes/upload";
import { storiesRouter } from "./routes/stories";
import { roomsRouter } from "./routes/rooms";
import { featuredRoomsRouter } from "./routes/featured-rooms";
import { communitiesRouter } from "./routes/communities";
import { messagesRouter } from "./routes/messages";
import { marketplaceRouter } from "./routes/marketplace";
import { notificationsRouter } from "./routes/notifications";
import walletRouter from "./routes/wallet";
import { userSuggestionsRouter } from "./routes/user-suggestions";
import { presenceRouter } from "./routes/presence";
import { trackAppVisit } from "./middleware/app-visit";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );

  app.use("/webhooks/stripe", stripeWebhookRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(trackAppVisit);

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/verification", verificationRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/stories", storiesRouter);
  app.use("/api/rooms", roomsRouter);
  app.use("/api/featured-rooms", featuredRoomsRouter);
  app.use("/api/communities", communitiesRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/marketplace", marketplaceRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/users", userSuggestionsRouter);
  app.use("/api/presence", presenceRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
