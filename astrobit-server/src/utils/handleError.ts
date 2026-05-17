import { Response } from "express";

export const handleApiError = (res: Response, error: unknown, code = 400) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("API Error:", error);
  res.status(code).json({ success: false, message });
};
