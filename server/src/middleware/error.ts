import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  console.error("[error]", err);

  const maybeErr = err as { status?: unknown; message?: unknown };

  const status = typeof maybeErr.status === "number" ? maybeErr.status : 500;
  const message = typeof maybeErr.message === "string" ? maybeErr.message : "Internal server error";

  res.status(status).json({ message });
};
