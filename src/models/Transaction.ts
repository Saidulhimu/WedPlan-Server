import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITransaction extends Document {
  vendorId: Types.ObjectId;
  plan: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  status: "succeeded" | "failed" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      default: "premium",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["succeeded", "failed", "pending"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
