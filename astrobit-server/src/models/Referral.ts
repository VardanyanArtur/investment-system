import { Schema, model, Document, Types } from "mongoose";

export interface IReferral extends Document {
  user: Types.ObjectId;          // владелец реф. кода
  code: string;                   // сам код (Date.now-userId)
  invitedUsers: Types.ObjectId[]; // кого пригласил
  invitedUsers2: Types.ObjectId[]; // кого пригласил
  createdAt: Date;
  updatedAt: Date;
  
}

const referralSchema = new Schema<IReferral>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  code: { type: String, required: true, unique: true, index: true },
  invitedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  invitedUsers2: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export const Referral = model<IReferral>("Referral", referralSchema);
