import { Schema, model, Document, Types } from "mongoose";

export type WithdrawStatus = "pending" | "success" | "canceled";

export interface IWithdraw extends Document {
    user: Types.ObjectId;
    status: WithdrawStatus;
    walletType: string;
    walletAddress: string;
    amountEarned: number;
    amountReferal: number;
    createdAt: Date;
    updatedAt: Date;
}

const withdrawSchema = new Schema<IWithdraw>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amountEarned: { type: Number, required: true, min: 1 },
        amountReferal: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ["pending", "success", "canceled"], default: "pending", index: true },
        walletType: { type: String },
        walletAddress: { type: String },

    },
    { timestamps: true }
);

// Быстрый выбор последней заявки
withdrawSchema.index({ user: 1, createdAt: -1 });

export const Withdraw = model<IWithdraw>("Withdraw", withdrawSchema);
