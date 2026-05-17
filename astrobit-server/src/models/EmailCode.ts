import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmailCode extends Document {
  user: Types.ObjectId;
  code: string;      // 6-значный код
  expiresAt: Date;
  createdAt: Date;
}

const emailCodeSchema = new Schema<IEmailCode>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Авто-удаление просроченных кодов
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailCode = mongoose.model<IEmailCode>("EmailCode", emailCodeSchema);
