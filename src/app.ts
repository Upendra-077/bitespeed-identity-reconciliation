import express from "express";
import { identifyContact } from "./identify.service";

const app = express();

app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/identify", async (req, res) => {
  try {
    const result = await identifyContact(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: "Invalid request",
      message: error.message,
    });
  }
});

export default app;