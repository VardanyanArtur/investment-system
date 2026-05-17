import { Schema, model, Document, Types } from "mongoose";

export interface IWallet extends Document {
  user: Types.ObjectId;
  currency: "USD";
  depositBalance: number;   // депозитный
  earnedBalance: number;    // заработанный
  referralBalance: number;  // реферальный
  createdAt: Date;
  updatedAt: Date;
  lastDailyBonusAt?: Date | null;

}

const walletSchema = new Schema<IWallet>({
  user: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true, index: true },
  currency: { type: String, enum: ["USD"], default: "USD" },
  depositBalance: { type: Number, default: 0 },
  earnedBalance: { type: Number, default: 0 },
  referralBalance: { type: Number, default: 0 },
  lastDailyBonusAt: { type: Date, default: null } // Когда последний раз получал

}, { timestamps: true });

export const Wallet = model<IWallet>("Wallet", walletSchema);
