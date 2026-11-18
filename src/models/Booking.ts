import mongoose, { Document, Schema, Types } from "mongoose";

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface IBooking extends Document {
  serviceId: Types.ObjectId;
  vendorId: Types.ObjectId;
  customerId: Types.ObjectId;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventDate: {
      type: String,
      required: [true, "Event date is required"],
    },
    eventLocation: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
