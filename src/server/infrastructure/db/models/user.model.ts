import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";

export type UserDocument = {
  _id: Types.ObjectId;
  email: string;
  /** Legacy "<hashHex>.<saltHex>" — select:false, never leaves the auth layer. */
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDocument> =
  (models.User as Model<UserDocument>) ??
  model<UserDocument>("User", userSchema, "users");
