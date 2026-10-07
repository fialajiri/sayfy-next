import { CHUNK, runUploadQueue, type QueueDeps } from "./bulk-upload-queue";

function file(n: number) {
  return {
    index: n,
    file: new File(["x"], `${n}.jpg`, { type: "image/jpeg" }),
  };
}

function deps(overrides: Partial<QueueDeps> = {}): QueueDeps {
  return {
    compress: async (f) => f,
    presign: async (_p, _s, files) =>
      files.map((f) => ({
        uploadUrl: `put:${f.name}`,
        key: f.name,
        publicUrl: `https://cdn/${f.name}`,
        requiredHeaders: {},
      })),
    put: async () => undefined,
    ...overrides,
  };
}

describe("runUploadQueue", () => {
  it("persists chunk by chunk, before starting the next chunk", async () => {
    const events: string[] = [];
    const files = Array.from({ length: CHUNK + 3 }, (_, i) => file(i));
    const result = await runUploadQueue(
      files,
      "2027",
      {
        onStatus: () => undefined,
        persist: async (urls) => {
          events.push(`persist ${urls.length}`);
          return true;
        },
      },
      deps({
        presign: async (p, s, f) => {
          events.push(`presign ${f.length}`);
          return deps().presign(p, s, f);
        },
      }),
    );
    expect(result).toEqual({ saved: CHUNK + 3, failed: 0 });
    expect(events).toEqual([
      `presign ${CHUNK}`,
      `persist ${CHUNK}`,
      "presign 3",
      "persist 3",
    ]);
  });

  it("keeps going when individual files fail, and persists only successes", async () => {
    const persisted: string[][] = [];
    const statuses = new Map<number, string>();
    const result = await runUploadQueue(
      [file(1), file(2), file(3)],
      "2027",
      {
        onStatus: (i, s) => statuses.set(i, s),
        persist: async (urls) => {
          persisted.push(urls);
          return true;
        },
      },
      deps({
        put: async (u) => {
          if (u.key === "2.jpg") throw new Error("S3");
        },
      }),
    );
    expect(result).toEqual({ saved: 2, failed: 1 });
    expect(persisted).toEqual([["https://cdn/1.jpg", "https://cdn/3.jpg"]]);
    expect(statuses.get(2)).toBe("error");
    expect(statuses.get(1)).toBe("saved");
  });

  it("marks a chunk as failed if persisting it fails (so it can be retried)", async () => {
    const result = await runUploadQueue(
      [file(1)],
      "2027",
      { onStatus: () => undefined, persist: async () => false },
      deps(),
    );
    expect(result).toEqual({ saved: 0, failed: 1 });
  });
});
