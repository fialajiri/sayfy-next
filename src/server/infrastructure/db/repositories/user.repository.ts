import "server-only";
import { Types } from "mongoose";
import type { UserRepository, UserWithPassword } from "@/server/domain/auth";
import { connectToDatabase } from "../connection";
import { UserModel, type UserDocument } from "../models/user.model";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toUser(doc: UserDocument): UserWithPassword {
  return {
    id: doc._id.toString(),
    email: doc.email,
    isAdmin: doc.isAdmin === true,
    password: doc.password,
  };
}

export const userRepository: UserRepository = {
  // Legacy emails were stored as typed — match case-insensitively without
  // rewriting them (docs/plans/phase-2 gotcha #4).
  async findByEmailWithPassword(email) {
    await connectToDatabase();
    const doc = await UserModel.findOne({
      email: new RegExp(`^${escapeRegex(email.trim())}$`, "i"),
    })
      .select("+password")
      .lean<UserDocument>();
    return doc ? toUser(doc) : null;
  },

  async findByIdWithPassword(id) {
    if (!Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const doc = await UserModel.findById(id)
      .select("+password")
      .lean<UserDocument>();
    return doc ? toUser(doc) : null;
  },

  async setPassword(id, stored) {
    if (!Types.ObjectId.isValid(id)) return false;
    await connectToDatabase();
    const result = await UserModel.updateOne(
      { _id: id },
      { $set: { password: stored } },
    );
    return result.matchedCount === 1;
  },
};
