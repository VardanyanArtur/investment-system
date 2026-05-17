import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "http";
import { connectMongo } from "./db/connect";
import { handleApiError } from "./utils/handleError";
import authRoutes from "./routes/auth.routes";
import depositRoutes from "./routes/deposit.routes";
import referralRoutes from "./routes/referral";
import vipRoutes from "./routes/vip.plane";
import meRoutes from "./routes/me.routes";
import gameRoutes from "./routes/gameRoutes";
import adminRoutes from "./routes/admin.routes"
import withdrawRoutes from "./routes/withdraw.routes";
import adminWithdrawRoutes from "./routes/admin.withdraw.routes";
import { webhookIPN } from "./controllers/deposit.controller";

let server: Server | null = null;
let isMongoConnected = false;




export const disconnectMongo = async () => {
  if (!isMongoConnected) return;

  try {
    await mongoose.disconnect();
    isMongoConnected = false;
    console.log("🛑 MongoDB disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting MongoDB:", error);
  }
};



export const startServer = async () => {
  if (server) throw new Error("Server is already running");

  try {
    await connectMongo(isMongoConnected);

    const app = express();
    const PORT: number = Number(process.env.PORT) || 3001;
    
    app.use(cors());
    app.post(
      "/api/deposit/webhook",
      express.raw({ type: "*/*" }),
      (req: any, res, next) => {
        try {
          console.log(1);
          req.rawBody = req.body.toString("utf8");
          req.body = JSON.parse(req.rawBody);
        } catch (e) {
          console.error("Failed to parse NOWPayments webhook body:", e);
          req.body = {};
        }
        next();
      },
      webhookIPN
    );
    app.use(express.json());

    app.get("/", (_req, res) => {
      res.json({ success: true, message: "MongoDB server is running 🚀" });
    });

    app.use("/api/deposit", depositRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/referral", referralRoutes);
    app.use("/api/vip", vipRoutes);
    app.use("/api/me", meRoutes);
    app.use("/api/game", gameRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/withdraw", withdrawRoutes);
    app.use("/api/admin/withdraws", adminWithdrawRoutes);

    app.use((error: Error, _req: Request, res: express.Response, _next: NextFunction) => {
      handleApiError(res, error);
    });


    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`✅ Server is running on PORT ${PORT}`);
        resolve();
      });
    });

    return app;
  } catch (error) {
    console.error("❌ Error starting server:", error);
    throw error;
  }
};

// ------------------------------
// ОСТАНОВКА СЕРВЕРА
// ------------------------------

export const stopServer = async () => {
  if (!server) throw new Error("Server is not running");

  await new Promise<void>((resolve) => {
    server!.close(() => {
      console.log("🛑 Server stopped");
      resolve();
    });
  });

  await disconnectMongo();
  server = null;
};

// ------------------------------
// ЗАПУСК ПРИ НАПРЯМУЮ
// ------------------------------

if (require.main === module) {
  startServer();
}



