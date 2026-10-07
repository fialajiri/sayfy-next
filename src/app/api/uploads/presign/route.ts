import { randomUUID } from "node:crypto";
import { presignRequestSchema } from "@/schemas/upload";
import { requireAdmin } from "@/server/actions/guards";
import { container } from "@/server/container";
import { buildUploadKey, extensionFor } from "@/server/domain/storage";
import { storageEnvPrefix } from "@/server/infrastructure/storage/s3";

// POST /api/uploads/presign — admin only (the legacy /api/upload had NO auth).
// Validates prefix/scope/MIME/size, generates the key server-side and returns
// presigned PUTs so the browser uploads straight to S3 (bypasses the ~4.5 MB
// Vercel body limit). Errors are generic; nothing internal leaks.
export async function POST(request: Request): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin.ok)
    return Response.json({ error: admin.error.message }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }
  const parsed = presignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatný soubor." },
      { status: 400 },
    );
  }

  const { prefix, scope, files } = parsed.data;
  try {
    const uploads = await Promise.all(
      files.map((file) => {
        const extension = extensionFor(file.type) ?? "bin";
        const key = buildUploadKey({
          envPrefix: storageEnvPrefix(),
          prefix,
          scope,
          id: randomUUID(),
          extension,
        });
        return container.storage.presignUpload({
          key,
          contentType: file.type,
          size: file.size,
        });
      }),
    );
    return Response.json({ uploads });
  } catch {
    return Response.json(
      { error: "Nahrání se nepodařilo připravit." },
      { status: 500 },
    );
  }
}
