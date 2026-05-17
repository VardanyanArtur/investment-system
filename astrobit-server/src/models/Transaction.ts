import { Schema, model, Document, Types } from "mongoose";

export type TxStatus =
  | "waiting"
  | "confirming"
  | "finished"
  | "failed"
  | "expired"
  | "sending";

export interface ITransaction extends Document {
  user: Types.ObjectId;

  // ✅ invoiceId: всегда есть сразу
  invoiceId: number;

  // ✅ paymentId: появляется после оплаты, может быть null
  paymentId: number | null;

  payAddress?: string;
  payAmount?: number;      // в крипте (TON/BTC/USDT...)
  payCurrency?: string;    // "ton" / "btc" / "usdttrc20" ...

  priceAmount: number;     // сумма в USD (исходная)
  priceCurrency: "usd";

  status: TxStatus;

  invoiceUrl?: string;     // ссылка на Invoice (для клиента)
  raw?: any;               // сырые данные NOWPayments (invoice/webhook)

  createdAt: Date;
  updatedAt: Date;
}

const txSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ Всегда есть (createDeposit)
    invoiceId: {
      type: Number,
      required: true,
      index: true,
    },

    // ✅ Может быть null, но должен быть unique, когда НЕ null
    paymentId: {
      type: Number,
      unique: true,
      sparse: true, // VERY IMPORTANT!
      default: null,
    },

    payAddress: { type: String },
    payAmount: { type: Number },
    payCurrency: { type: String },

    priceAmount: { type: Number, required: true },
    priceCurrency: { type: String, default: "usd" },

    status: {
      type: String,
      enum: ["waiting", "confirming", "finished", "failed", "expired", "sending"],
      default: "waiting",
      index: true,
    },

    invoiceUrl: { type: String },
    raw: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>("Transaction", txSchema);
