export const ASPECTS = [
  { id: "original", label: "Původní", value: null },
  { id: "4:3", label: "4 : 3", value: 4 / 3 },
  { id: "3:2", label: "3 : 2", value: 3 / 2 },
  { id: "16:9", label: "16 : 9", value: 16 / 9 },
  { id: "1:1", label: "1 : 1", value: 1 },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

/** Numeric ratio for react-easy-crop; "original" uses the image's own ratio. */
export function aspectValue(
  id: AspectId,
  natural: { width: number; height: number } | null,
): number {
  const preset = ASPECTS.find((a) => a.id === id)?.value ?? null;
  if (preset !== null) return preset;
  return natural && natural.height > 0 ? natural.width / natural.height : 4 / 3;
}
