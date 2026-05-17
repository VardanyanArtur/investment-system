import { Schema, model, Document } from "mongoose";

export interface IVipPlan extends Document {
  title: string;
  min: number;        // 2500
  max?: number | null; // 7000 или null (для VIP 5)
  daily: string;
  cashback: string;
  icon: string;
  items: string[];
  delay: number;
}

const VipPlanSchema = new Schema<IVipPlan>(
  {
    title: { type: String, required: true },
    min: { type: Number, required: true },
    max: { type: Number, default: null }, 
    daily: { type: String, required: true },
    cashback: { type: String, required: true },
    icon: { type: String, required: true },
    items: { type: [String], default: [] },
    delay: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const VipPlan = model<IVipPlan>("VipPlan", VipPlanSchema);
