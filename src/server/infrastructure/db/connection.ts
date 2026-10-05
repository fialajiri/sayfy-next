import "server-only";
import mongoose from "mongoose";

// Serverless-safe connection. Vercel invokes functions many times; caching the
// connection on `globalThis` across invocations avoids exhausting Atlas connections.
// Locally MONGODB_URI must be the TEST copy (sayfyho-memorial-test).
// Copied from zive-teplice-next. See docs/03-backend-plan.md §Mongoose connection.

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose._mongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose._mongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // Fail loudly rather than silently connecting to a default;
    // locally this MUST be the cloned TEST database (docs/plans/phase-1 §0a).
    throw new Error("MONGODB_URI is not set.");
  }

  cache.promise ??= mongoose.connect(uri, {
    maxPoolSize: 5,
    // Bound connection attempts so a misconfigured/unreachable DB fails fast
    // instead of hanging a build or request for the full 30s default.
    serverSelectionTimeoutMS: 8000,
  });
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Don't cache a failed attempt — the next request must be able to retry.
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
