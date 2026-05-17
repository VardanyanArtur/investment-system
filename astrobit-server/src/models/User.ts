import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  referredBy?: Types.ObjectId | null; // <- кто пригласил
  createdAt: Date;
  updatedAt: Date;
  referredBy2?: Types.ObjectId | null; // <- кто пригласил приглошенного
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  referredBy2: { type: Schema.Types.ObjectId, ref: "User", default: null }, 
}, { timestamps: true });


export const User = model<IUser>("User", userSchema);
