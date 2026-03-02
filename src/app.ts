import express, { Request, Response, NextFunction } from "express";
import { identifyContact } from "./identify.service";

const app = express();

/**
 * Middleware
 */
app.use(express.json());

/**
 * Health Check
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Identify Route
 */
app.post("/identify", async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body ?? {};

  // Basic validation
  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "Either email or phoneNumber must be provided",
    });
  }

  try {
    const result = await identifyContact({ email, phoneNumber });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Identify error:", error);

    return res.status(400).json({
      error: "Invalid request",
      message: error?.message || "Something went wrong",
    });
  }
});

/**
 * 404 Handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Global Error Handler (fallback)
 */
app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
);

export default app;