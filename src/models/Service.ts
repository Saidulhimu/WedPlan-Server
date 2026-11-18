import mongoose, { Document, Schema, Types } from "mongoose";

export type ServiceStatus = "pending" | "approved" | "rejected";

export interface IService extends Document {
  vendorId: Types.ObjectId;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: ServiceStatus;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Photography & Videography",
        "Wedding Venues",
        "Decoration & Florist",
        "Catering Services",
        "Makeup & Styling",
        "Wedding Fashion",
      ],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      required: [true, "At least one service image is required"],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "Must provide at least one image",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text search index for name, description, location
ServiceSchema.index({ serviceName: "text", location: "text", description: "text" });

export const Service = mongoose.model<IService>("Service", ServiceSchema);
