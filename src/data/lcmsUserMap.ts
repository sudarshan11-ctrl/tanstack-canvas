import raw from "./lcmsUserMap.json";

type LcmsUserEntry = { lcmsUserId: number; name: string; matchMethod: string };

const entries = raw as Record<string, LcmsUserEntry>;

// portal personId -> LCMS numeric user_id
export const lcmsUserMap: Record<string, number> = Object.fromEntries(
  Object.entries(entries).map(([id, v]) => [id, v.lcmsUserId]),
);

export function getLcmsUserId(personId: string): number | undefined {
  return lcmsUserMap[personId];
}
