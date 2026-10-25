import { getDatabase } from "./db";

export interface MixTrack {
  id: string;
  mix_id: string;
  song_id: string;
  position: number;
  title: string;
  artist: string;
  rating: number;
}

export async function getMixTracks(
  mixId: string
): Promise<MixTrack[]> {
  if (!mixId.trim()) {
    throw new Error("A mix ID is required.");
  }

  const db = await getDatabase();

  return db.select<MixTrack[]>(
    `
    SELECT
      mt.id,
      mt.mix_id,
      mt.song_id,
      mt.position,
      s.title,
      s.artist,
      s.rating
    FROM mix_tracks AS mt
    INNER JOIN songs AS s
      ON mt.song_id = s.id
    WHERE mt.mix_id = $1
    ORDER BY mt.position ASC, mt.rowid ASC
    `,
    [mixId]
  );
}
