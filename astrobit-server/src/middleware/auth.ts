import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
