import { Schema, model, Document, Types } from "mongoose";

export interface IGameBonusHistory extends Document {
  user: Types.ObjectId;      // Кто получил
  vipPlan: Types.ObjectId;   // По какому тарифу
  amount: number;            // Сколько начислили
  date: Date;                // Когда
}

const GameBonusHistorySchema = new Schema<IGameBonusHistory>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  vipPlan: { type: Schema.Types.ObjectId, ref: "VipPlan", required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export const GameBonusHistory = model<IGameBonusHistory>("GameBonusHistory", GameBonusHistorySchema);
