import "server-only";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isDeletableKey, type StoragePort } from "@/server/domain/storage";

const PRESIGN_TTL_SECONDS = 300;

function requireEnv(name: string): string {
  // Trimmed: a stray newline from a pasted credential breaks every signature.
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Key prefix that isolates non-production uploads and DELETES. Defaults to
 * "dev/" everywhere except a real Vercel production deployment — never based on
 * NODE_ENV, because `next start` locally is also "production" while pointing at
 * the test DB, whose rows reference live images. S3_KEY_PREFIX overrides.
 */
export function storageEnvPrefix(
  env: Record<string, string | undefined> = process.env,
): string {
  const explicit = env.S3_KEY_PREFIX?.trim();
  if (explicit) return explicit.endsWith("/") ? explicit : `${explicit}/`;
  return env.VERCEL_ENV === "production" ? "" : "dev/";
}

type Config = { client: S3Client; bucket: string; publicHost: string };
let cached: Config | null = null;

// Lazy: public pages must not crash without AWS env — only admin writes need it.
function config(): Config {
  if (cached) return cached;
  cached = {
    client: new S3Client({
      region: requireEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
      // From zive-teplice: SDK v3's default CRC32 checksum would bake an
      // EMPTY-body checksum into presigned PUTs and S3 would reject the upload.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
    bucket: requireEnv("AWS_BUCKET_NAME"),
    publicHost: requireEnv("S3_PUBLIC_HOST"),
  };
  return cached;
}

function publicUrl(key: string): string {
  return `https://${config().publicHost}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function createS3Storage(): StoragePort {
  return {
    publicUrl,

    async presignUpload({ key, contentType, size }) {
      const { client, bucket } = config();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
        CacheControl: "public, max-age=31536000, immutable", // keys are unique uuids
      });
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: PRESIGN_TTL_SECONDS,
        signableHeaders: new Set(["content-type", "content-length"]),
      });
      return {
        uploadUrl,
        key,
        publicUrl: publicUrl(key),
        requiredHeaders: { "Content-Type": contentType },
      };
    },

    async deleteMany(keys) {
      const envPrefix = storageEnvPrefix();
      const allowed = [...new Set(keys)].filter((key) =>
        isDeletableKey(key, envPrefix),
      );
      const skipped = new Set(keys).size - allowed.length;
      if (skipped > 0)
        console.info(
          `[storage] dev guard skipped ${skipped} non-${envPrefix} key(s)`,
        );
      const { client, bucket } = config();
      let deleted = 0;
      for (let i = 0; i < allowed.length; i += 1000) {
        const batch = allowed.slice(i, i + 1000);
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        );
        deleted += batch.length;
      }
      return { deleted, skipped };
    },
  };
}
